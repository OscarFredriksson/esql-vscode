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
