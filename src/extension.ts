/**
 * IBM App Connect Enterprise Flow Visualizer Extension
 */

import * as vscode from 'vscode';
import { FlowPreviewPanel } from './preview/flowPreviewPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('ESQL Language & ACE Flow Visualizer extension is now active');

  // Register command to open preview
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
