/**
 * ESQL Language Server
 *
 * Provides: completions, hover, document symbols, and diagnostics
 * for IBM App Connect Enterprise (ACE) ESQL files.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Hover,
  MarkupKind,
  DocumentSymbol,
  DocumentSymbolParams,
  SymbolKind,
  Range,
  Position,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildKeywordCompletions,
  buildTypeCompletions,
  buildBuiltinVarCompletions,
  buildBuiltinFuncCompletions,
  lookupHoverDoc,
} from './esqlData';
import {
  MESSAGE_TREE_SCHEMA,
  getFieldAtPath,
  getCompletionsForPath,
  type FieldInfo,
} from '../../src/messageTreeSchema';

// ─── Connection & documents ───────────────────────────────────────────────────

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments<TextDocument>(TextDocument);
let workspaceFolderUris: string[] = [];

interface EsqlServerSettings {
  externalLibraries: string[];
}

const DEFAULT_SETTINGS: EsqlServerSettings = {
  externalLibraries: [],
};

let globalSettings: EsqlServerSettings = DEFAULT_SETTINGS;

function getWorkspacePaths(): string[] {
  return workspaceFolderUris
    .map((uri) => fileUriToPath(uri))
    .filter((p): p is string => !!p);
}

async function refreshSettings(): Promise<void> {
  try {
    const cfg = (await connection.workspace.getConfiguration('esql')) as
      | Partial<EsqlServerSettings>
      | undefined;

    globalSettings = {
      externalLibraries: Array.isArray(cfg?.externalLibraries)
        ? cfg!.externalLibraries.filter((v): v is string => typeof v === 'string')
        : [],
    };
  } catch {
    globalSettings = DEFAULT_SETTINGS;
  }

  // Settings change can affect index roots, so clear cache.
  externalFunctionCache.clear();
}

// ─── Initialization ───────────────────────────────────────────────────────────

connection.onInitialize((params: InitializeParams): InitializeResult => {
  workspaceFolderUris =
    params.workspaceFolders?.map((w) => w.uri) ??
    (params.rootUri ? [params.rootUri] : []);

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', ' '],
      },
      hoverProvider: true,
      documentSymbolProvider: true,
      definitionProvider: true,
    },
  };
});

connection.onInitialized(() => {
  connection.client.register(DidChangeConfigurationNotification.type, undefined);
  refreshSettings();
});

connection.onDidChangeConfiguration(() => {
  refreshSettings();
});

// ─── Static completions (built once) ─────────────────────────────────────────

const STATIC_COMPLETIONS: CompletionItem[] = [
  ...buildKeywordCompletions(),
  ...buildTypeCompletions(),
  ...buildBuiltinVarCompletions(),
  ...buildBuiltinFuncCompletions(),
];

// ─── Scope Tracking & Context-Awareness ──────────────────────────────────────

/**
 * Represents a local variable with its declaration info.
 */
interface VariableInfo {
  name: string;
  line: number;
  scope: ScopeContext;
}

/**
 * Represents a scope (block, function, procedure) and the variables declared within it.
 */
interface ScopeContext {
  name: string; // e.g., "MyFunction", or "GLOBAL" for file-level
  line: number; // Where the scope starts (e.g., BEGIN or CREATE MODULE line)
  endLine: number; // Where the scope ends
  depth: number; // Nesting depth (0 = file level)
  parent?: ScopeContext;
  variables: VariableInfo[];
}

/**
 * Builds a scope tree by parsing BEGIN/END and CREATE blocks.
 * Returns variables indexed by line number for efficient lookup.
 */
function buildScopeTree(text: string): Map<number, ScopeContext> {
  const stripped = stripComments(text);
  const lines = stripped.split('\n');
  
  const scopeStack: ScopeContext[] = [];
  const lineToScope: Map<number, ScopeContext> = new Map();
  
  // Create global scope
  const globalScope: ScopeContext = {
    name: 'GLOBAL',
    line: 0,
    endLine: lines.length - 1,
    depth: 0,
    variables: [],
  };
  scopeStack.push(globalScope);
  
  const beginRe = /\bBEGIN\b/gi;
  const endRe = /\bEND\s+(?:MODULE|IF|WHILE|FOR|REPEAT|LOOP|CASE)?\b|\bEND\s*;/gi;
  const createModuleRe = /\bCREATE\s+(?:COMPUTE\s+)?MODULE\s+([A-Za-z_][\w$]*)/i;
  const createFuncRe = /\bCREATE\s+(?:COMPUTE\s+)?FUNCTION\s+([A-Za-z_][\w$]*)\s*\(/i;
  const createProcRe = /\bCREATE\s+(?:COMPUTE\s+)?PROCEDURE\s+([A-Za-z_][\w$]*)\s*\(/i;
  const declareRe = /\bDECLARE\s+([A-Za-z_][\w$]*)\s+(?:SHARED|EXTERNAL)?\s*[A-Z]/gi;
  
  let depth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    lineToScope.set(i, scopeStack[scopeStack.length - 1]);
    
    // Check for declaration of a named scope (CREATE MODULE/FUNCTION/PROCEDURE)
    let scopeName: string | null = null;
    const mMod = createModuleRe.exec(line);
    if (mMod) scopeName = mMod[1];
    
    const mFunc = createFuncRe.exec(line);
    if (!scopeName && mFunc) scopeName = mFunc[1];
    
    const mProc = createProcRe.exec(line);
    if (!scopeName && mProc) scopeName = mProc[1];
    
    if (scopeName) {
      const newScope: ScopeContext = {
        name: scopeName,
        line: i,
        endLine: lines.length - 1,
        depth: depth + 1,
        parent: scopeStack[scopeStack.length - 1],
        variables: [],
      };
      scopeStack.push(newScope);
    }
    
    // Check for DECLARE statements and add variables to current scope
    let declareMatch: RegExpExecArray | null;
    declareRe.lastIndex = 0;
    while ((declareMatch = declareRe.exec(line)) !== null) {
      const varName = declareMatch[1];
      const currentScope = scopeStack[scopeStack.length - 1];
      currentScope.variables.push({
        name: varName,
        line: i,
        scope: currentScope,
      });
    }
    
    // Count BEGIN/END to track nesting depth
    let beginMatch: RegExpExecArray | null;
    beginRe.lastIndex = 0;
    while ((beginMatch = beginRe.exec(line)) !== null) {
      depth++;
    }
    
    let endMatch: RegExpExecArray | null;
    endRe.lastIndex = 0;
    while ((endMatch = endRe.exec(line)) !== null) {
      depth = Math.max(0, depth - 1);
      // If we're closing a named scope, mark its end line and pop from stack
      if (depth === 0 && scopeStack.length > 1) {
        const closingScope = scopeStack[scopeStack.length - 1];
        closingScope.endLine = i;
        scopeStack.pop();
      }
    }
  }
  
  // Finalize global scope
  globalScope.endLine = lines.length - 1;
  
  return lineToScope;
}

/**
 * Gets all variables visible at a specific line, respecting scope.
 * Returns variables from current scope and all parent scopes.
 */
function getVariablesInScope(lineToScope: Map<number, ScopeContext>, line: number): VariableInfo[] {
  const scope = lineToScope.get(line);
  if (!scope) return [];
  
  const vars: VariableInfo[] = [];
  const seen = new Set<string>();
  
  // Walk up the scope chain and collect variables
  let current: ScopeContext | undefined = scope;
  while (current) {
    for (const v of current.variables) {
      const key = v.name.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        vars.push(v);
      }
    }
    current = current.parent;
  }
  
  return vars;
}

/**
 * Builds a breadcrumb string showing the scope hierarchy.
 * Example: "GLOBAL > MyFunction"
 */
function buildScopeBreadcrumb(scope: ScopeContext): string {
  const parts: string[] = [];
  let current: ScopeContext | undefined = scope;
  while (current) {
    parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(' > ');
}

/**
 * Extract message path from line (handles InputRoot or OutputRoot patterns)
 */
function extractMessagePathPrefix(lineText: string, cursorPos: number): string | null {
  const before = lineText.slice(0, cursorPos);
  const match = /(?:InputRoot|OutputRoot)[\w$.]*$/.exec(before);
  if (!match) return null;

  const path = match[0];
  if (path.endsWith('.')) {
    return path.slice(0, -1);
  }
  return path;
}

/**
 * Builds a map showing where symbols/variables are defined for go-to-definition.
 * Returns Map<symbolName, { line, column, scope }>
 */
function buildDefinitionMap(
  text: string,
  lineToScope: Map<number, ScopeContext>
): Map<string, { line: number; column: number; scope: ScopeContext }> {
  const stripped = stripComments(text);
  const lines = stripped.split('\n');
  const definitions = new Map<string, { line: number; column: number; scope: ScopeContext }>();
  
  const createModuleRe = /\bCREATE\s+(?:COMPUTE\s+)?MODULE\s+([A-Za-z_][\w$]*)/i;
  const createFuncRe = /\bCREATE\s+(?:COMPUTE\s+)?FUNCTION\s+([A-Za-z_][\w$]*)\s*\(/i;
  const createProcRe = /\bCREATE\s+(?:COMPUTE\s+)?PROCEDURE\s+([A-Za-z_][\w$]*)\s*\(/i;
  const declareRe = /\bDECLARE\s+([A-Za-z_][\w$]*)\s+(?:SHARED|EXTERNAL)?\s*[A-Z]/gi;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const scope = lineToScope.get(i) || { name: 'GLOBAL', line: 0, endLine: lines.length - 1, depth: 0, variables: [] };
    
    // Check for MODULE/FUNCTION/PROCEDURE definitions
    let match: RegExpExecArray | null;
    
    match = createModuleRe.exec(line);
    if (match) {
      definitions.set(match[1].toUpperCase(), {
        line: i,
        column: line.indexOf(match[1]),
        scope,
      });
    }
    
    match = createFuncRe.exec(line);
    if (match) {
      definitions.set(match[1].toUpperCase(), {
        line: i,
        column: line.indexOf(match[1]),
        scope,
      });
    }
    
    match = createProcRe.exec(line);
    if (match) {
      definitions.set(match[1].toUpperCase(), {
        line: i,
        column: line.indexOf(match[1]),
        scope,
      });
    }
    
    // Check for DECLARE statements
    declareRe.lastIndex = 0;
    while ((match = declareRe.exec(line)) !== null) {
      definitions.set(match[1].toUpperCase(), {
        line: i,
        column: line.indexOf(match[1]),
        scope,
      });
    }
  }
  
  return definitions;
}

interface ExternalFunctionDef {
  name: string;
  kind: 'FUNCTION' | 'PROCEDURE';
  schema: string;
  moduleName?: string;
  sourceRoot?: string;
  uri: string;
  line: number;
  character: number;
  signature?: string;
}

interface ExternalFunctionIndex {
  rootPath: string;
  timestamp: number;
  defs: ExternalFunctionDef[];
}

const externalFunctionCache = new Map<string, ExternalFunctionIndex>();
const EXTERNAL_INDEX_TTL_MS = 15_000;

function fileUriToPath(uri: string): string | null {
  if (!uri.startsWith('file://')) {
    return null;
  }
  return decodeURIComponent(uri.replace('file://', ''));
}

function pathToFileUri(filePath: string): string {
  return `file://${encodeURI(filePath)}`;
}

function extractBrokerSchema(text: string): string | null {
  const stripped = stripComments(text);
  const m =
    /^\s*BROKER\s+SCHEMA\s+([A-Za-z_][\w.]*)\s*;?\s*$/im.exec(stripped);
  return m ? m[1] : null;
}

function extractPathSchemas(text: string): string[] {
  const stripped = stripComments(text);
  // PATH can span multiple lines and may contain spaces/newlines around commas.
  const m = /^\s*PATH\s+([\s\S]*?);/im.exec(stripped);
  if (!m) {
    return [];
  }

  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function listEsqlFiles(rootPath: string): string[] {
  const files: string[] = [];
  const skipNames = new Set(['.git', 'node_modules', 'out', '.vscode']);

  const walk = (dirPath: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!skipNames.has(entry.name)) {
          walk(path.join(dirPath, entry.name));
        }
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.esql')) {
        files.push(path.join(dirPath, entry.name));
      }
    }
  };

  walk(rootPath);
  return files;
}

function parseExternalFunctionsFromText(text: string, uri: string): ExternalFunctionDef[] {
  const stripped = stripComments(text);
  const lines = stripped.split('\n');
  const schema = extractBrokerSchema(stripped);
  if (!schema) {
    return [];
  }

  let moduleName: string | undefined;
  const defs: ExternalFunctionDef[] = [];

  const moduleRe = /\bCREATE\s+(?:COMPUTE\s+)?MODULE\s+([A-Za-z_][\w$]*)/i;
  const functionRe =
    /\bCREATE\s+(?:COMPUTE\s+)?FUNCTION\s+([A-Za-z_][\w$]*)\s*\(/i;
  const procedureRe =
    /\bCREATE\s+(?:COMPUTE\s+)?PROCEDURE\s+([A-Za-z_][\w$]*)\s*\(/i;

  const readSignatureFromLine = (line: string, name: string): string => {
    const start = line.toUpperCase().indexOf(name.toUpperCase());
    if (start < 0) {
      return `${name}(...)`;
    }

    const afterName = line.slice(start + name.length);
    const closeIdx = afterName.indexOf(')');
    if (closeIdx >= 0) {
      return `${name}${afterName.slice(0, closeIdx + 1).trimEnd()}`;
    }

    return `${name}(...)`;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const mod = moduleRe.exec(line);
    if (mod) {
      moduleName = mod[1];
    }

    const fn = functionRe.exec(line);
    if (fn) {
      const fnName = fn[1];
      defs.push({
        name: fnName,
        kind: 'FUNCTION',
        schema,
        moduleName,
        uri,
        line: i,
        character: line.indexOf(fnName),
        signature: readSignatureFromLine(line, fnName),
      });
    }

    const proc = procedureRe.exec(line);
    if (proc) {
      const procName = proc[1];
      defs.push({
        name: procName,
        kind: 'PROCEDURE',
        schema,
        moduleName,
        uri,
        line: i,
        character: line.indexOf(procName),
        signature: readSignatureFromLine(line, procName),
      });
    }
  }

  return defs;
}

function pickWorkspaceRootForDocument(docUri: string): string | null {
  const docPath = fileUriToPath(docUri);
  if (!docPath) {
    return null;
  }

  const wsPaths = getWorkspacePaths();

  for (const wsPath of wsPaths) {
    if (docPath.startsWith(wsPath)) {
      return wsPath;
    }
  }

  return path.dirname(docPath);
}

function getConfiguredLibraryRoots(docUri: string): string[] {
  const configured = globalSettings.externalLibraries;
  if (configured.length === 0) {
    return [];
  }

  const roots = new Set<string>();
  const wsPaths = getWorkspacePaths();
  const docRoot = pickWorkspaceRootForDocument(docUri);

  for (const entry of configured) {
    const trimmed = entry.trim();
    if (trimmed.length === 0) {
      continue;
    }

    // Absolute path
    if (path.isAbsolute(trimmed)) {
      if (fs.existsSync(trimmed) && fs.statSync(trimmed).isDirectory()) {
        roots.add(trimmed);
      }
      continue;
    }

    // Relative paths: resolve against current doc root and all workspace roots.
    const candidates = new Set<string>();
    if (docRoot) {
      candidates.add(path.resolve(docRoot, trimmed));
    }
    for (const wsPath of wsPaths) {
      candidates.add(path.resolve(wsPath, trimmed));
    }

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          roots.add(candidate);
        }
      } catch {
        // ignore bad paths
      }
    }
  }

  return [...roots];
}

function getIndexRootsForDocument(docUri: string): string[] {
  const configuredRoots = getConfiguredLibraryRoots(docUri);
  if (configuredRoots.length > 0) {
    return configuredRoots;
  }

  const workspaceRoot = pickWorkspaceRootForDocument(docUri);
  return workspaceRoot ? [workspaceRoot] : [];
}

function getExternalFunctionDefsForDocument(doc: TextDocument): ExternalFunctionDef[] {
  const text = doc.getText();
  const currentSchema = extractBrokerSchema(text);
  const pathSchemaOrder = extractPathSchemas(text).map((s) => s.toUpperCase());
  if (currentSchema) {
    const currentUpper = currentSchema.toUpperCase();
    if (!pathSchemaOrder.includes(currentUpper)) {
      pathSchemaOrder.push(currentUpper);
    }
  }

  const pathSchemas = new Set(pathSchemaOrder);
  const schemaRank = new Map<string, number>(
    pathSchemaOrder.map((s, idx) => [s, idx]),
  );

  const rootPaths = getIndexRootsForDocument(doc.uri);
  if (rootPaths.length === 0) {
    return [];
  }

  const rootRank = new Map<string, number>(
    rootPaths.map((root, idx) => [root, idx]),
  );

  const aggregated: ExternalFunctionDef[] = [];
  const now = Date.now();

  for (const rootPath of rootPaths) {
    const cached = externalFunctionCache.get(rootPath);
    if (!cached || now - cached.timestamp > EXTERNAL_INDEX_TTL_MS) {
      const files = listEsqlFiles(rootPath);
      const defs: ExternalFunctionDef[] = [];

      for (const filePath of files) {
        let fileText: string;
        try {
          fileText = fs.readFileSync(filePath, 'utf8');
        } catch {
          continue;
        }

        defs.push(
          ...parseExternalFunctionsFromText(fileText, pathToFileUri(filePath)),
        );
      }

      externalFunctionCache.set(rootPath, {
        rootPath,
        timestamp: now,
        defs,
      });
    }

    const index = externalFunctionCache.get(rootPath);
    if (index) {
      aggregated.push(
        ...index.defs.map((d) => ({
          ...d,
          sourceRoot: rootPath,
        })),
      );
    }
  }

  const deduped = new Map<string, ExternalFunctionDef>();
  for (const def of aggregated) {
    if (!pathSchemas.has(def.schema.toUpperCase())) {
      continue;
    }

    const key = `${def.uri}:${def.line}:${def.character}:${def.name.toUpperCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, def);
    }
  }

  const ordered = [...deduped.values()];
  ordered.sort((a, b) => {
    const schemaA = schemaRank.get(a.schema.toUpperCase()) ?? Number.MAX_SAFE_INTEGER;
    const schemaB = schemaRank.get(b.schema.toUpperCase()) ?? Number.MAX_SAFE_INTEGER;
    if (schemaA !== schemaB) {
      return schemaA - schemaB;
    }

    const rootA = a.sourceRoot
      ? (rootRank.get(a.sourceRoot) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    const rootB = b.sourceRoot
      ? (rootRank.get(b.sourceRoot) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    if (rootA !== rootB) {
      return rootA - rootB;
    }

    const nameCmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    if (nameCmp !== 0) {
      return nameCmp;
    }

    const uriCmp = a.uri.localeCompare(b.uri);
    if (uriCmp !== 0) {
      return uriCmp;
    }

    return a.line - b.line;
  });

  return ordered;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip line and block comments from text, preserving line count. */
function stripComments(text: string): string {
  // Replace block comments with spaces (preserve newlines)
  let result = text.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, ' '),
  );
  // Replace line comments
  result = result.replace(/--[^\n]*/g, (m) => ' '.repeat(m.length));
  // Replace single-quoted strings (preserve newlines)
  result = result.replace(/'(?:[^']|'')*'/g, (m) =>
    m.replace(/[^\n]/g, ' '),
  );
  return result;
}

/**
 * Extracts the word at a given position in text.
 * Returns the word and whether the character immediately before is '.'.
 */
function wordAtPosition(
  doc: TextDocument,
  pos: Position,
): { word: string; precededByDot: boolean } {
  const lineText = doc.getText({
    start: { line: pos.line, character: 0 },
    end: { line: pos.line, character: pos.character },
  });
  const match = /[A-Za-z_][\w$]*$/.exec(lineText);
  const word = match ? match[0] : '';
  const before = lineText.slice(0, lineText.length - word.length);
  const precededByDot = before.trimEnd().endsWith('.');
  return { word, precededByDot };
}

// ─── Symbol extraction ────────────────────────────────────────────────────────

interface ESQLSymbol {
  name: string;
  kind: SymbolKind;
  /** Line of the declaration (0-based). */
  line: number;
  /** Line of the matching END (0-based), or end of document if not found. */
  endLine: number;
  children: ESQLSymbol[];
}

/**
 * Very lightweight parser that locates CREATE MODULE/FUNCTION/PROCEDURE blocks
 * and tracks BEGIN/END depth so we can build a symbol tree.
 */
function extractSymbols(text: string): ESQLSymbol[] {
  const stripped = stripComments(text);
  const lines = stripped.split('\n');

  const symbols: ESQLSymbol[] = [];
  const stack: ESQLSymbol[] = []; // nesting stack

  // Regex patterns (case-insensitive applied per-line)
  const moduleRe =
    /\bCREATE\s+(?:COMPUTE\s+)?MODULE\s+([A-Za-z_][\w$]*)/i;
  const funcRe =
    /\bCREATE\s+(?:COMPUTE\s+)?FUNCTION\s+([A-Za-z_][\w$]*)\s*\(/i;
  const procRe =
    /\bCREATE\s+(?:COMPUTE\s+)?PROCEDURE\s+([A-Za-z_][\w$]*)\s*\(/i;

  // Tokens that open/close depth
  const beginRe = /\bBEGIN\b/gi;
  const endRe =
    /\bEND\s+(?:MODULE|IF|WHILE|FOR|REPEAT|LOOP|CASE)\b|\bEND\s*;/gi;

  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- Check for declarations ---
    let decl: { name: string; kind: SymbolKind } | null = null;

    const mMod = moduleRe.exec(line);
    if (mMod) {
      decl = { name: mMod[1], kind: SymbolKind.Module };
    }

    const mFunc = funcRe.exec(line);
    if (!decl && mFunc) {
      decl = { name: mFunc[1], kind: SymbolKind.Function };
    }

    const mProc = procRe.exec(line);
    if (!decl && mProc) {
      decl = { name: mProc[1], kind: SymbolKind.Method };
    }

    if (decl) {
      const sym: ESQLSymbol = {
        name: decl.name,
        kind: decl.kind,
        line: i,
        endLine: lines.length - 1,
        children: [],
      };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(sym);
      } else {
        symbols.push(sym);
      }

      stack.push(sym);
    }

    // --- Count BEGIN / END to track depth ---
    // We count BEGINs and ENDs to know when to pop the stack.
    // Each declaration is opened by a BEGIN and closed by an END.
    let m: RegExpExecArray | null;
    beginRe.lastIndex = 0;
    while ((m = beginRe.exec(line)) !== null) {
      depth++;
    }

    endRe.lastIndex = 0;
    while ((m = endRe.exec(line)) !== null) {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && stack.length > 0) {
        const closing = stack.pop()!;
        closing.endLine = i;
      }
    }
  }

  return symbols;
}

/**
 * Collects all variables declared in a scope and creates DocumentSymbols for them.
 */
function getVariableSymbols(variables: VariableInfo[]): DocumentSymbol[] {
  return variables.map((v) => {
    return DocumentSymbol.create(
      v.name,
      `Variable (${v.scope.name})`,
      SymbolKind.Variable,
      {
        start: { line: v.line, character: 0 },
        end: { line: v.line, character: 80 },
      },
      {
        start: { line: v.line, character: 0 },
        end: { line: v.line, character: 80 },
      },
      [],
    );
  });
}

function getVariablesForSymbolRange(
  lineToScope: Map<number, ScopeContext>,
  symbol: ESQLSymbol,
): VariableInfo[] {
  const byName = new Map<string, VariableInfo>();

  for (let line = symbol.line; line <= symbol.endLine; line++) {
    const scope = lineToScope.get(line);
    if (!scope) {
      continue;
    }

    for (const variable of scope.variables) {
      if (variable.line < symbol.line || variable.line > symbol.endLine) {
        continue;
      }

      const key = variable.name.toUpperCase();
      const existing = byName.get(key);
      if (!existing || variable.line < existing.line) {
        byName.set(key, variable);
      }
    }
  }

  return [...byName.values()].sort((a, b) => a.line - b.line);
}

function toDocumentSymbols(
  syms: ESQLSymbol[],
  totalLines: number,
  lineToScope?: Map<number, ScopeContext>,
): DocumentSymbol[] {
  return syms.map((s) => {
    const range: Range = {
      start: { line: s.line, character: 0 },
      end: { line: Math.min(s.endLine, totalLines - 1), character: 0 },
    };

    // If we have scope information, collect variables for this symbol's scope
    let children: DocumentSymbol[] = toDocumentSymbols(s.children, totalLines, lineToScope);
    
    if (lineToScope) {
      const variables = getVariablesForSymbolRange(lineToScope, s);
      if (variables.length > 0) {
        // Add variable symbols as children of the scope
        const varSymbols = getVariableSymbols(variables);
        children = [...varSymbols, ...children];
      }
    }

    return DocumentSymbol.create(
      s.name,
      undefined,
      s.kind,
      range,
      range,
      children,
    );
  });
}

/** Collect all symbol names for dynamic completions. */
function symbolCompletions(syms: ESQLSymbol[]): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (const s of syms) {
    items.push({
      label: s.name,
      kind:
        s.kind === SymbolKind.Module
          ? CompletionItemKind.Module
          : s.kind === SymbolKind.Function
            ? CompletionItemKind.Function
            : CompletionItemKind.Method,
      detail:
        s.kind === SymbolKind.Module
          ? 'ESQL module'
          : s.kind === SymbolKind.Function
            ? 'ESQL function'
            : 'ESQL procedure',
    });
    items.push(...symbolCompletions(s.children));
  }
  return items;
}

/** Extract all local DECLARE variables from the text. */
function extractLocalVariables(text: string): CompletionItem[] {
  const stripped = stripComments(text);

  // Match DECLARE statements:
  // DECLARE <varName> [SHARED] [EXTERNAL] <type> ...;
  // Capture the variable name (first identifier after DECLARE)
  const declareRe = /\bDECLARE\s+([A-Za-z_][\w$]*)\s+(?:SHARED|EXTERNAL)?\s*[A-Z]/gi;

  const items: CompletionItem[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  declareRe.lastIndex = 0;
  while ((m = declareRe.exec(stripped)) !== null) {
    const varName = m[1];
    if (!seen.has(varName.toUpperCase())) {
      seen.add(varName.toUpperCase());
      items.push({
        label: varName,
        kind: CompletionItemKind.Variable,
        detail: 'Local variable',
      });
    }
  }

  return items;
}

/**
 * Extract field/table aliases and created field names.
 * Examples:
 * - SELECT x AS alias
 * - CREATE ... AS refName
 * - CREATE ... NAME 'FieldName'
 */
function extractFieldAliases(text: string): CompletionItem[] {
  const stripped = stripComments(text);

  // Match AS aliases that terminate like statement aliases, not CAST(... AS TYPE).
  const selectAliasRe =
    /\bAS\s+([A-Za-z_][\w$]*)\b(?=\s*(?:,|FROM\b|WHERE\b|GROUP\b|HAVING\b|ORDER\b|INTO\b|VALUES\b|JOIN\b|ON\b|UNION\b|EXCEPT\b|INTERSECT\b|;|$))/gi;

  // Match CREATE ... AS <identifier> aliases/references.
  const createAsAliasRe =
    /\bCREATE\b[^;\n]*\bAS\s+([A-Za-z_][\w$]*)\b(?=\s*(?:REFERENCE\b|IDENTITY\b|TYPE\b|VALUE\b|NAME\b|;|$))/gi;

  // Match CREATE ... NAME 'FieldName' and CREATE ... NAME "FieldName".
  const createNameRe =
    /\bCREATE\b[^;\n]*\bNAME\s+(['"])([^'"\r\n]+)\1/gi;

  const items: CompletionItem[] = [];
  const seen = new Set<string>();

  const pushAlias = (label: string, detail: string): void => {
    const key = label.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push({
        label,
        kind: CompletionItemKind.Field,
        detail,
      });
    }
  };

  let m: RegExpExecArray | null;

  selectAliasRe.lastIndex = 0;
  while ((m = selectAliasRe.exec(stripped)) !== null) {
    pushAlias(m[1], 'Field alias');
  }

  createAsAliasRe.lastIndex = 0;
  while ((m = createAsAliasRe.exec(stripped)) !== null) {
    pushAlias(m[1], 'CREATE alias');
  }

  createNameRe.lastIndex = 0;
  while ((m = createNameRe.exec(stripped)) !== null) {
    const fieldName = m[2].trim();
    if (fieldName.length > 0) {
      pushAlias(fieldName, 'Created field name');
    }
  }

  return items;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

function validateDocument(doc: TextDocument): Diagnostic[] {
  const text = doc.getText();
  const stripped = stripComments(text);
  const lines = stripped.split('\n');
  const diagnostics: Diagnostic[] = [];

  // Track BEGIN/END balance
  const beginStack: { line: number; ch: number }[] = [];
  const beginRe = /\bBEGIN\b/gi;
  const endBlockRe = /\bEND\s*(?:MODULE|IF|WHILE|FOR|REPEAT|LOOP|CASE)?\s*;/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let m: RegExpExecArray | null;

    beginRe.lastIndex = 0;
    while ((m = beginRe.exec(line)) !== null) {
      beginStack.push({ line: i, ch: m.index });
    }

    endBlockRe.lastIndex = 0;
    while ((m = endBlockRe.exec(line)) !== null) {
      beginStack.pop();
    }
  }

  // Any unmatched BEGINs
  for (const loc of beginStack) {
    diagnostics.push({
      severity: DiagnosticSeverity.Warning,
      range: {
        start: { line: loc.line, character: loc.ch },
        end: { line: loc.line, character: loc.ch + 5 },
      },
      message: 'Unmatched BEGIN — no corresponding END found.',
      source: 'esql',
    });
  }

  // Track loop open/close balance (WHILE/FOR/REPEAT/LOOP)
  const loopStacks: Record<string, Array<{ line: number; ch: number }>> = {
    WHILE: [],
    FOR: [],
    REPEAT: [],
    LOOP: [],
  };

  const whileStartRe = /^\s*WHILE\b/i;
  const forStartRe = /^\s*FOR\b/i;
  const repeatStartRe = /^\s*REPEAT\b/i;
  const loopStartRe = /^\s*LOOP\b/i;
  const loopEndRe = /\bEND\s+(WHILE|FOR|REPEAT|LOOP)\s*;/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (whileStartRe.test(line)) {
      loopStacks.WHILE.push({ line: i, ch: line.search(/\bWHILE\b/i) });
    }
    if (forStartRe.test(line)) {
      loopStacks.FOR.push({ line: i, ch: line.search(/\bFOR\b/i) });
    }
    if (repeatStartRe.test(line)) {
      loopStacks.REPEAT.push({ line: i, ch: line.search(/\bREPEAT\b/i) });
    }
    if (loopStartRe.test(line)) {
      loopStacks.LOOP.push({ line: i, ch: line.search(/\bLOOP\b/i) });
    }

    let loopMatch: RegExpExecArray | null;
    loopEndRe.lastIndex = 0;
    while ((loopMatch = loopEndRe.exec(line)) !== null) {
      const loopType = loopMatch[1].toUpperCase();
      const stack = loopStacks[loopType];
      if (stack.length > 0) {
        stack.pop();
      } else {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: { line: i, character: loopMatch.index },
            end: { line: i, character: loopMatch.index + loopMatch[0].length },
          },
          message: `Unmatched END ${loopType} — no corresponding ${loopType} start found.`,
          source: 'esql',
        });
      }
    }
  }

  for (const loopType of Object.keys(loopStacks)) {
    for (const loc of loopStacks[loopType]) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: loc.line, character: Math.max(0, loc.ch) },
          end: { line: loc.line, character: Math.max(0, loc.ch) + loopType.length },
        },
        message: `${loopType} loop is not closed — expected END ${loopType};`,
        source: 'esql',
      });
    }
  }

  // Warn on END MODULE without a preceding CREATE MODULE (simple heuristic)
  const endModuleRe = /\bEND\s+MODULE\s*;/gi;
  const createModuleRe = /\bCREATE\s+(?:COMPUTE\s+)?MODULE\b/gi;

  let moduleCount = 0;
  let endModuleCount = 0;

  createModuleRe.lastIndex = 0;
  let mm: RegExpExecArray | null;
  while ((mm = createModuleRe.exec(stripped)) !== null) {
    moduleCount++;
  }
  endModuleRe.lastIndex = 0;
  while ((mm = endModuleRe.exec(stripped)) !== null) {
    endModuleCount++;
  }

  if (endModuleCount > moduleCount) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      message: `Found ${endModuleCount} END MODULE but only ${moduleCount} CREATE MODULE declaration(s).`,
      source: 'esql',
    });
  } else if (moduleCount > endModuleCount) {
    diagnostics.push({
      severity: DiagnosticSeverity.Warning,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      message: `CREATE MODULE without matching END MODULE (${moduleCount} open, ${endModuleCount} closed).`,
      source: 'esql',
    });
  }

  const startsNewStatementRe =
    /^\s*(DECLARE|SET|IF|WHILE|FOR|CALL|RETURN|END|CREATE)\b/i;

  // Check DECLARE/SET/bare CREATE statements for missing semicolons,
  // including multiline statements that may span to the end of file.
  const declareStartRe = /^\s*DECLARE\b/i;
  const setStartRe = /^\s*SET\b/i;
  const createStartRe = /^\s*CREATE\b/i;
  const createDeclarationRe =
    /^\s*CREATE\s+(?:COMPUTE\s+)?(?:MODULE|PROCEDURE|FUNCTION)\b/i;

  const findStatementBounds = (
    startLine: number,
  ): { terminated: boolean; endLine: number } => {
    for (let j = startLine; j < lines.length; j++) {
      if (j > startLine && startsNewStatementRe.test(lines[j].trim())) {
        return { terminated: false, endLine: j - 1 };
      }
      if (lines[j].includes(';')) {
        return { terminated: true, endLine: j };
      }
    }
    return { terminated: false, endLine: lines.length - 1 };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let message: string | null = null;
    if (declareStartRe.test(line)) {
      message = 'DECLARE statement may be missing a semicolon.';
    } else if (setStartRe.test(line)) {
      message = 'SET statement may be missing a semicolon.';
    } else if (createStartRe.test(line) && !createDeclarationRe.test(line)) {
      message = 'CREATE statement may be missing a semicolon.';
    }

    if (!message) {
      continue;
    }

    const { terminated, endLine } = findStatementBounds(i);
    if (!terminated) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: i, character: 0 },
          end: { line: endLine, character: lines[endLine]?.length ?? 0 },
        },
        message,
        source: 'esql',
      });
    }

    // Skip ahead to avoid duplicate warnings within the same multiline statement.
    i = Math.max(i, endLine);
  }

  return diagnostics;
}

// ─── Document events → diagnostics ───────────────────────────────────────────

function sendDiagnostics(doc: TextDocument): void {
  const diagnostics = validateDocument(doc);
  connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

documents.onDidChangeContent((change) => {
  sendDiagnostics(change.document);
});

documents.onDidOpen((event) => {
  sendDiagnostics(event.document);
});

documents.onDidClose((event) => {
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// ─── Completions ──────────────────────────────────────────────────────────────

connection.onCompletion(
  (params: TextDocumentPositionParams): CompletionItem[] => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) {
      return STATIC_COMPLETIONS;
    }

    const lineText = doc.getText({
      start: { line: params.position.line, character: 0 },
      end: { line: params.position.line, character: params.position.character },
    });

    // Check if we're in a message path (InputRoot.XXX or OutputRoot.XXX)
    const messagePath = extractMessagePathPrefix(lineText, params.position.character);
    if (messagePath) {
      const completions = getCompletionsForPath(messagePath);
      return completions.map(name => ({
        label: name,
        kind: CompletionItemKind.Field,
        detail: 'Message field',
        sortText: `_${name}`,
      }));
    }

    const { precededByDot } = wordAtPosition(doc, params.position);

    // After a dot we shouldn't suggest keywords; return empty to let the
    // user type the field name freely (no false positives).
    if (precededByDot) {
      return [];
    }

    const text = doc.getText();
    const syms = extractSymbols(text);
    const dynamicItems = symbolCompletions(syms);
    const fieldAliases = extractFieldAliases(text);
    const externalDefs = getExternalFunctionDefsForDocument(doc);
    const externalItems: CompletionItem[] = externalDefs.map((d) => ({
      label: d.name,
      kind:
        d.kind === 'FUNCTION'
          ? CompletionItemKind.Function
          : CompletionItemKind.Method,
      detail: `External ${d.kind.toLowerCase()} (${d.schema}${d.sourceRoot ? ` • ${path.basename(d.sourceRoot)}` : ''})`,
    }));
    
    // Build scope tree and get variables visible at current line
    const lineToScope = buildScopeTree(text);
    const scopedVars = getVariablesInScope(lineToScope, params.position.line);
    
    // Convert scoped variables to completion items with scope info
    const scopedVarItems: CompletionItem[] = scopedVars.map(v => ({
      label: v.name,
      kind: CompletionItemKind.Variable,
      detail: `Local variable (${v.scope.name})`,
      sortText: `_${v.name}`, // Prioritize over other suggestions
    }));

    // Deduplicate all dynamic items against static ones and each other.
    const staticLabels = new Set(
      STATIC_COMPLETIONS.map((i) => i.label.toUpperCase()),
    );
    const uniqueDynamic: CompletionItem[] = [];
    for (const item of [
      ...dynamicItems,
      ...externalItems,
      ...scopedVarItems,
      ...fieldAliases,
    ]) {
      const key = item.label.toUpperCase();
      if (!staticLabels.has(key)) {
        staticLabels.add(key);
        uniqueDynamic.push(item);
      }
    }

    return [...STATIC_COMPLETIONS, ...uniqueDynamic];
  },
);

// ─── Hover ────────────────────────────────────────────────────────────────────

connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) {
    return null;
  }

  const lineText = doc.getText({
    start: { line: params.position.line, character: 0 },
    end: { line: params.position.line + 1, character: 0 },
  });

  // Extract the word under cursor
  const ch = params.position.character;
  const before = lineText.slice(0, ch);
  const after = lineText.slice(ch);
  const wordBefore = /[A-Za-z_][\w$]*$/.exec(before)?.[0] ?? '';
  const wordAfter = /^[\w$]*/.exec(after)?.[0] ?? '';
  const word = wordBefore + wordAfter;

  if (!word) {
    return null;
  }

  // Check if this is a message field path
  const messagePath = extractMessagePathPrefix(lineText.slice(0, ch), ch);
  if (messagePath && messagePath.includes('.')) {
    const fieldInfo = getFieldAtPath(messagePath + '.' + word);
    if (fieldInfo) {
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: `**${word}** (${fieldInfo.type})\n\n${fieldInfo.description}`,
        },
        range: {
          start: { line: params.position.line, character: ch - wordBefore.length },
          end: { line: params.position.line, character: ch + wordAfter.length },
        },
      };
    }
  }

  // Check if we're hovering over a message root (InputRoot/OutputRoot)
  if ((word.toUpperCase() === 'INPUTROOT' || word.toUpperCase() === 'OUTPUTROOT') && MESSAGE_TREE_SCHEMA[word]) {
    const schema = MESSAGE_TREE_SCHEMA[word];
    const fields = Object.keys(schema)
      .filter(k => k !== '*')
      .join(', ');
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${word}** - Message root\n\nAvailable fields: ${fields}`,
      },
      range: {
        start: { line: params.position.line, character: ch - wordBefore.length },
        end: { line: params.position.line, character: ch + wordAfter.length },
      },
    };
  }

  // Check if this is a local variable in scope
  const text = doc.getText();
  const lineToScope = buildScopeTree(text);
  const scopedVars = getVariablesInScope(lineToScope, params.position.line);
  const localVar = scopedVars.find(v => v.name.toUpperCase() === word.toUpperCase());
  
  if (localVar) {
    const scopeBreadcrumb = buildScopeBreadcrumb(localVar.scope);
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${localVar.name}** (Local variable)\n\nDeclared in: ${scopeBreadcrumb}\n\nLine ${localVar.line + 1}`,
      },
      range: {
        start: { line: params.position.line, character: ch - wordBefore.length },
        end: { line: params.position.line, character: ch + wordAfter.length },
      },
    };
  }

  const externalDefs = getExternalFunctionDefsForDocument(doc);
  const externalDef = externalDefs.find(
    (d) => d.name.toUpperCase() === word.toUpperCase(),
  );
  if (externalDef) {
    const locationHint = externalDef.moduleName
      ? `${externalDef.schema}.${externalDef.moduleName}`
      : externalDef.schema;
    const signature = externalDef.signature
      ? `\n\nSignature: ${externalDef.signature}`
      : '';
    const libraryInfo = externalDef.sourceRoot
      ? `\n\nLibrary: ${externalDef.sourceRoot}`
      : '';

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${externalDef.name}** (External ${externalDef.kind.toLowerCase()})\n\nSchema: ${locationHint}${signature}${libraryInfo}`,
      },
      range: {
        start: { line: params.position.line, character: ch - wordBefore.length },
        end: { line: params.position.line, character: ch + wordAfter.length },
      },
    };
  }

  // Fall back to built-in documentation
  const md = lookupHoverDoc(word);
  if (!md) {
    return null;
  }

  const startCh = ch - wordBefore.length;
  const endCh = ch + wordAfter.length;

  return {
    contents: { kind: MarkupKind.Markdown, value: md },
    range: {
      start: { line: params.position.line, character: startCh },
      end: { line: params.position.line, character: endCh },
    },
  };
});

// ─── Go-to-Definition ────────────────────────────────────────────────────────

connection.onDefinition((params: TextDocumentPositionParams) => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) {
    return null;
  }

  const lineText = doc.getText({
    start: { line: params.position.line, character: 0 },
    end: { line: params.position.line + 1, character: 0 },
  });

  // Extract the word under cursor
  const ch = params.position.character;
  const before = lineText.slice(0, ch);
  const after = lineText.slice(ch);
  const wordBefore = /[A-Za-z_][\w$]*$/.exec(before)?.[0] ?? '';
  const wordAfter = /^[\w$]*/.exec(after)?.[0] ?? '';
  const word = wordBefore + wordAfter;

  if (!word) {
    return null;
  }

  const text = doc.getText();
  const lineToScope = buildScopeTree(text);
  const definitions = buildDefinitionMap(text, lineToScope);
  
  // Look up the definition
  const def = definitions.get(word.toUpperCase());
  if (def) {
    return {
      uri: doc.uri,
      range: {
        start: { line: def.line, character: def.column },
        end: { line: def.line, character: def.column + word.length },
      },
    };
  }

  const externalDefs = getExternalFunctionDefsForDocument(doc);
  const matches = externalDefs.filter(
    (d) => d.name.toUpperCase() === word.toUpperCase(),
  );
  if (matches.length === 0) {
    return null;
  }

  // Returning multiple locations enables the editor to present a target picker
  // when the same external function exists in multiple libraries.
  return matches.map((externalDef) => ({
    uri: externalDef.uri,
    range: {
      start: { line: externalDef.line, character: externalDef.character },
      end: {
        line: externalDef.line,
        character: externalDef.character + externalDef.name.length,
      },
    },
  }));
});

// ─── Document symbols (outline) ───────────────────────────────────────────────

connection.onDocumentSymbol(
  (params: DocumentSymbolParams): DocumentSymbol[] => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) {
      return [];
    }

    const text = doc.getText();
    const syms = extractSymbols(text);
    const lineCount = doc.lineCount;
    
    // Also build scope tree to include variables in outline
    const lineToScope = buildScopeTree(text);
    
    return toDocumentSymbols(syms, lineCount, lineToScope);
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────

documents.listen(connection);
connection.listen();
