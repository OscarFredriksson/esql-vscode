/**
 * IBM App Connect Enterprise Flow Visualizer Extension
 */

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { FlowPreviewPanel } from './preview/flowPreviewPanel';

let client: LanguageClient;

function getExternalLibraries(): string[] {
  const cfg = vscode.workspace.getConfiguration('esql');
  const libs = cfg.get<string[]>('externalLibraries', []);
  return Array.isArray(libs) ? libs : [];
}

async function updateExternalLibraries(libs: string[]): Promise<void> {
  const target = vscode.workspace.workspaceFolders?.length
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;

  await vscode.workspace
    .getConfiguration('esql')
    .update('externalLibraries', libs, target);
}

async function addExternalLibraries(newPaths: string[]): Promise<void> {
  const libs = getExternalLibraries();
  const existing = new Set(libs.map((x) => x.toLowerCase()));

  const normalized = newPaths
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const added: string[] = [];
  for (const next of normalized) {
    const key = next.toLowerCase();
    if (!existing.has(key)) {
      existing.add(key);
      added.push(next);
    }
  }

  if (added.length === 0) {
    vscode.window.showInformationMessage(
      'All selected library paths are already configured.',
    );
    return;
  }

  await updateExternalLibraries([...libs, ...added]);
  vscode.window.showInformationMessage(
    `Added ${added.length} external librar${added.length === 1 ? 'y' : 'ies'}.`,
  );
}

async function showExternalLibraries(): Promise<void> {
  const libs = getExternalLibraries();
  if (libs.length === 0) {
    vscode.window.showInformationMessage(
      'No external libraries configured. Use "ESQL: Manage External Libraries" to add one.',
    );
    return;
  }

  const picked = await vscode.window.showQuickPick(
    libs.map((lib) => ({
      label: lib,
      description: 'Configured library root',
    })),
    {
      title: 'Configured External Libraries',
      placeHolder: 'Configured roots used for external ESQL IntelliSense',
      canPickMany: false,
    },
  );

  if (picked) {
    await vscode.env.clipboard.writeText(picked.label);
    vscode.window.showInformationMessage('Library path copied to clipboard.');
  }
}

async function manageExternalLibraries(): Promise<void> {
  while (true) {
    const libs = getExternalLibraries();

    const options: vscode.QuickPickItem[] = [
      {
        label: '$(add) Add library path',
        description: 'Absolute path or workspace-relative path',
      },
      {
        label: '$(folder-opened) Add library from file explorer',
        description: 'Pick one or more folders',
      },
      {
        label: '$(list-unordered) Show configured libraries',
        description: `${libs.length} configured`,
      },
    ];

    if (libs.length > 0) {
      options.push({
        label: '$(clear-all) Clear all libraries',
        description: 'Remove all configured external library roots',
      });

      for (const lib of libs) {
        options.push({
          label: `$(trash) Remove ${lib}`,
          detail: lib,
          description: 'Remove this library root',
        });
      }
    }

    const choice = await vscode.window.showQuickPick(options, {
      title: 'ESQL External Libraries',
      placeHolder: 'Add/remove roots used for external function IntelliSense',
      canPickMany: false,
    });

    if (!choice) {
      return;
    }

    if (choice.label.includes('Add library path')) {
      const value = await vscode.window.showInputBox({
        title: 'Add External Library Path',
        prompt:
          'Enter an absolute path or a path relative to the current workspace folder',
        placeHolder: 'Example: /Users/me/libs/ace-common or sca/common-lib',
        ignoreFocusOut: true,
        validateInput: (v) =>
          v.trim().length === 0 ? 'Path cannot be empty.' : undefined,
      });

      if (!value) {
        continue;
      }

      await addExternalLibraries([value]);
      continue;
    }

    if (choice.label.includes('Add library from file explorer')) {
      const defaultUri =
        vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file('/');

      const picked = await vscode.window.showOpenDialog({
        title: 'Select External Library Folder(s)',
        defaultUri,
        openLabel: 'Add Library Folder',
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: true,
      });

      if (!picked || picked.length === 0) {
        continue;
      }

      await addExternalLibraries(picked.map((u) => u.fsPath));
      continue;
    }

    if (choice.label.includes('Show configured libraries')) {
      await showExternalLibraries();
      continue;
    }

    if (choice.label.includes('Clear all libraries')) {
      const confirm = await vscode.window.showWarningMessage(
        'Remove all configured external libraries?',
        { modal: true },
        'Clear All',
      );
      if (confirm === 'Clear All') {
        await updateExternalLibraries([]);
        vscode.window.showInformationMessage('All external libraries cleared.');
      }
      continue;
    }

    if (choice.detail) {
      const remaining = libs.filter((x) => x !== choice.detail);
      await updateExternalLibraries(remaining);
      vscode.window.showInformationMessage(
        `Removed external library: ${choice.detail}`,
      );
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('ESQL Language & ACE Flow Visualizer extension is now active');

  // ── Language Server ────────────────────────────────────────────────────────
  const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'esql' }],
    synchronize: {
      configurationSection: 'esql',
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.esql'),
    },
  };

  client = new LanguageClient(
    'esqlLanguageServer',
    'ESQL Language Server',
    serverOptions,
    clientOptions,
  );

  client.start();
  context.subscriptions.push({ dispose: () => client.stop() });

  // ── Flow Visualizer commands ──────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('aceFlowVisualizer.openPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const document = editor.document;
      if (!isFlowFile(document)) {
        vscode.window.showErrorMessage(
          'Active file is not a .msgflow or .subflow file',
        );
        return;
      }

      FlowPreviewPanel.createOrShow(
        context.extensionUri,
        document.uri,
        vscode.ViewColumn.Active,
      );
    }),
  );

  // Register command to open preview to the side
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'aceFlowVisualizer.openPreviewToSide',
      () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage('No active editor');
          return;
        }

        const document = editor.document;
        if (!isFlowFile(document)) {
          vscode.window.showErrorMessage(
            'Active file is not a .msgflow or .subflow file',
          );
          return;
        }

        FlowPreviewPanel.createOrShow(
          context.extensionUri,
          document.uri,
          vscode.ViewColumn.Beside,
        );
      },
    ),
  );

  // Auto-update preview when switching between flow files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && isFlowFile(editor.document)) {
        // If there's a visible preview, update it to show the new active file
        if (FlowPreviewPanel.hasVisiblePreview()) {
          FlowPreviewPanel.updateCurrentPreview(editor.document.uri);
        }
      }
    }),
  );

  // ── ESQL IntelliSense configuration commands ─────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'esql.manageExternalLibraries',
      manageExternalLibraries,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'esql.showExternalLibraries',
      showExternalLibraries,
    ),
  );
}

function isFlowFile(document: vscode.TextDocument): boolean {
  const fileName = document.fileName.toLowerCase();
  return fileName.endsWith('.msgflow') || fileName.endsWith('.subflow');
}

export function deactivate() {
  console.log(
    'ESQL Language & ACE Flow Visualizer extension is now deactivated',
  );
}
