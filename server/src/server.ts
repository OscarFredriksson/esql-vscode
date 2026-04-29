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
import {
  buildKeywordCompletions,
  buildTypeCompletions,
  buildBuiltinVarCompletions,
  buildBuiltinFuncCompletions,
  lookupHoverDoc,
} from './esqlData';

// ─── Connection & documents ───────────────────────────────────────────────────

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments<TextDocument>(TextDocument);

// ─── Initialization ───────────────────────────────────────────────────────────

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', ' '],
      },
      hoverProvider: true,
      documentSymbolProvider: true,
    },
  };
});

connection.onInitialized(() => {
  connection.client.register(DidChangeConfigurationNotification.type, undefined);
});

// ─── Static completions (built once) ─────────────────────────────────────────

const STATIC_COMPLETIONS: CompletionItem[] = [
  ...buildKeywordCompletions(),
  ...buildTypeCompletions(),
  ...buildBuiltinVarCompletions(),
  ...buildBuiltinFuncCompletions(),
];

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

function toDocumentSymbols(syms: ESQLSymbol[], totalLines: number): DocumentSymbol[] {
  return syms.map((s) => {
    const range: Range = {
      start: { line: s.line, character: 0 },
      end: { line: Math.min(s.endLine, totalLines - 1), character: 0 },
    };
    return DocumentSymbol.create(
      s.name,
      undefined,
      s.kind,
      range,
      range,
      toDocumentSymbols(s.children, totalLines),
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

    const { precededByDot } = wordAtPosition(doc, params.position);

    // After a dot we shouldn't suggest keywords; return empty to let the
    // user type the field name freely (no false positives).
    if (precededByDot) {
      return [];
    }

    const text = doc.getText();
    const syms = extractSymbols(text);
    const dynamicItems = symbolCompletions(syms);
    const localVars = extractLocalVariables(text);
    const fieldAliases = extractFieldAliases(text);

    // Deduplicate all dynamic items against static ones and each other.
    const staticLabels = new Set(
      STATIC_COMPLETIONS.map((i) => i.label.toUpperCase()),
    );
    const uniqueDynamic: CompletionItem[] = [];
    for (const item of [...dynamicItems, ...localVars, ...fieldAliases]) {
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
    return toDocumentSymbols(syms, lineCount);
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────

documents.listen(connection);
connection.listen();
