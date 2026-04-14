/**
 * Custom Editor Provider for IBM ACE Flow files
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { FlowParser } from '../parser/flowParser';
import { FlowModel, NODE_TYPE_INFO } from '../models/flowModel';

export class FlowEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'aceFlowVisualizer';
  private parser: FlowParser;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.parser = new FlowParser();
  }

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new FlowEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      FlowEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    );
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken,
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    const updateWebview = () => {
      try {
        const xmlContent = document.getText();
        const flowModel = this.parser.parse(xmlContent);
        webviewPanel.webview.postMessage({
          type: 'update',
          content: xmlContent,
          flowModel: flowModel,
        });
      } catch (error: any) {
        webviewPanel.webview.postMessage({
          type: 'error',
          message: error.message,
        });
      }
    };

    // Get initial content
    let initialContent = document.getText();
    let initialFlowModel = null;
    let initialError = null;
    try {
      initialFlowModel = this.parser.parse(initialContent);
    } catch (error: any) {
      initialError = error.message;
    }

    // Set up webview content with initial data embedded
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      initialContent,
      initialFlowModel,
      initialError,
    );

    // Listen for document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      },
    );

    // Listen for messages from webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'webviewReady':
          // Webview is ready, send initial content
          updateWebview();
          break;
        case 'updateText':
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            message.content,
          );
          await vscode.workspace.applyEdit(edit);
          break;
      }
    });

    // Clean up
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    initialContent: string,
    initialFlowModel: FlowModel | null,
    initialError: string | null,
  ): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css'),
    );

    // Create color mapping for nodes
    const nodeColors: Record<string, string> = {};
    for (const [type, info] of Object.entries(NODE_TYPE_INFO)) {
      nodeColors[type] = info.color;
    }

    // Escape content for embedding in JavaScript
    const escapedContent = initialContent
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    const initialData = JSON.stringify(initialFlowModel);
    const errorData = initialError ? JSON.stringify(initialError) : 'null';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACE Flow Visualizer</title>
  <link href="${styleUri}" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      overflow: hidden;
      height: 100vh;
    }

    .container {
      display: flex;
      height: 100vh;
      width: 100%;
    }

    .editor-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 2px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }

    .editor-header {
      padding: 8px 12px;
      background: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-tab-activeForeground);
    }

    .xml-editor {
      flex: 1;
      width: 100%;
      padding: 12px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      border: none;
      outline: none;
      font-family: var(--vscode-editor-font-family, 'Monaco', 'Courier New', monospace);
      font-size: var(--vscode-editor-font-size, 12px);
      line-height: 1.5;
      resize: none;
      overflow: auto;
    }

    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .preview-header {
      padding: 8px 12px;
      background: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-tab-activeForeground);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .preview-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .diagram-panel {
      flex: 1;
      overflow: auto;
      background: var(--vscode-editor-background);
      position: relative;
    }

    .properties-panel {
      width: 350px;
      overflow-y: auto;
      background: var(--vscode-sideBar-background);
      border-left: 1px solid var(--vscode-panel-border);
      padding: 16px;
    }

    #flowDiagram {
      min-width: 100%;
      min-height: 100%;
    }

    .node {
      cursor: pointer;
    }

    .node:hover rect {
      stroke-width: 2.5;
      filter: brightness(1.1);
    }

    .node.selected rect {
      stroke: var(--vscode-focusBorder);
      stroke-width: 3;
    }

    .node rect {
      stroke: var(--vscode-panel-border);
      stroke-width: 1.5;
      rx: 4;
    }

    .node text {
      fill: var(--vscode-editor-foreground);
      font-size: 12px;
      font-family: var(--vscode-font-family);
      pointer-events: none;
      user-select: none;
    }

    .connection {
      fill: none;
      stroke: var(--vscode-editorLineNumber-foreground);
      stroke-width: 1.5;
    }

    .connection-arrow {
      fill: var(--vscode-editorLineNumber-foreground);
    }

    .property-section {
      margin-bottom: 20px;
    }

    .property-section h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
    }

    .property-row {
      margin-bottom: 8px;
      padding: 6px;
      background: var(--vscode-input-background);
      border-radius: 3px;
    }

    .property-label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 2px;
    }

    .property-value {
      font-size: 12px;
      color: var(--vscode-foreground);
      word-break: break-all;
    }

    .no-selection {
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 40px 20px;
    }

    .flow-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .flow-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .flow-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .node-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .terminal-list {
      list-style: none;
      padding: 0;
    }

    .terminal-item {
      padding: 4px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .terminal-direction {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .terminal-direction.input {
      background: #4CAF50;
    }

    .terminal-direction.output {
      background: #2196F3;
    }

    .error-message {
      color: var(--vscode-errorForeground);
      padding: 20px;
      text-align: center;
    }

    .status-indicator {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .status-indicator.error {
      color: var(--vscode-errorForeground);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="editor-panel">
      <div class="editor-header">📝 XML Source</div>
      <textarea class="xml-editor" id="xmlEditor" spellcheck="false"></textarea>
    </div>
    <div class="preview-panel">
      <div class="preview-header">
        <span>👁️ Visual Preview</span>
        <span class="status-indicator" id="statusIndicator">Ready</span>
      </div>
      <div class="preview-content">
        <div class="diagram-panel" id="diagramPanel">
          <svg id="flowDiagram"></svg>
        </div>
        <div class="properties-panel" id="propertiesPanel">
          <div class="no-selection">
            Loading...
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let flowModel = ${initialData};
    let selectedNodeId = null;
    let isUpdating = false;

    const xmlEditor = document.getElementById('xmlEditor');
    const statusIndicator = document.getElementById('statusIndicator');

    // Set initial content
    xmlEditor.value = \`${escapedContent}\`;

    // Check for initial error
    const initialError = ${errorData};
    if (initialError) {
      showError(initialError);
      updateStatus('Parse Error', true);
    } else if (flowModel) {
      renderFlow();
      updateStatus('Ready', false);
    }

    // Signal that webview is ready
    vscode.postMessage({ type: 'webviewReady' });

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'update':
          if (!isUpdating) {
            xmlEditor.value = message.content;
          }
          flowModel = message.flowModel;
          renderFlow();
          updateStatus('Ready', false);
          break;
        case 'error':
          showError(message.message);
          updateStatus('Parse Error', true);
          break;
      }
    });

    // Handle text changes in editor
    let debounceTimeout;
    xmlEditor.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      updateStatus('Modified...', false);
      debounceTimeout = setTimeout(() => {
        isUpdating = true;
        vscode.postMessage({
          type: 'updateText',
          content: xmlEditor.value
        });
        setTimeout(() => { isUpdating = false; }, 100);
      }, 500);
    });

    function updateStatus(text, isError) {
      statusIndicator.textContent = text;
      statusIndicator.classList.toggle('error', isError);
    }

    function showError(errorMessage) {
      const panel = document.getElementById('propertiesPanel');
      panel.innerHTML = \`
        <div class="error-message">
          <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
          <div style="font-weight: 600; margin-bottom: 10px;">Parse Error</div>
          <div style="font-size: 11px;">\${escapeHtml(errorMessage)}</div>
        </div>
      \`;

      const svg = document.getElementById('flowDiagram');
      svg.innerHTML = '';
    }

    // Render the flow diagram
    function renderFlow() {
      if (!flowModel || !flowModel.nodes) {
        return;
      }

      const svg = document.getElementById('flowDiagram');
      svg.innerHTML = ''; // Clear previous content

      const nodes = flowModel.nodes;
      const connections = flowModel.connections;

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.location.x);
        minY = Math.min(minY, node.location.y);
        maxX = Math.max(maxX, node.location.x + 120);
        maxY = Math.max(maxY, node.location.y + 60);
      });

      const padding = 50;
      const width = maxX - minX + 2 * padding;
      const height = maxY - minY + 2 * padding;

      svg.setAttribute('viewBox', \`\${minX - padding} \${minY - padding} \${width} \${height}\`);
      svg.setAttribute('width', Math.max(width, 800));
      svg.setAttribute('height', Math.max(height, 600));

      // Define arrow marker
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3, 0 6');
      polygon.setAttribute('class', 'connection-arrow');
      marker.appendChild(polygon);
      defs.appendChild(marker);
      svg.appendChild(defs);

      // Render connections first (so they appear behind nodes)
      connections.forEach(conn => {
        const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
        const targetNode = nodes.find(n => n.id === conn.targetNodeId);

        if (sourceNode && targetNode) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const startX = sourceNode.location.x + 120;
          const startY = sourceNode.location.y + 30;
          const endX = targetNode.location.x;
          const endY = targetNode.location.y + 30;

          const midX = (startX + endX) / 2;
          const d = \`M \${startX} \${startY} Q \${midX} \${startY}, \${midX} \${(startY + endY) / 2} T \${endX} \${endY}\`;

          path.setAttribute('d', d);
          path.setAttribute('class', 'connection');
          path.setAttribute('marker-end', 'url(#arrowhead)');
          svg.appendChild(path);
        }
      });

      // Render nodes
      nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'node');
        g.setAttribute('data-node-id', node.id);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', node.location.x);
        rect.setAttribute('y', node.location.y);
        rect.setAttribute('width', '120');
        rect.setAttribute('height', '60');
        rect.setAttribute('fill', getNodeColor(node.type));

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.location.x + 60);
        text.setAttribute('y', node.location.y + 35);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = truncateText(node.label, 14);

        g.appendChild(rect);
        g.appendChild(text);

        g.addEventListener('click', () => selectNode(node.id));

        svg.appendChild(g);
      });

      // Show flow info in properties panel initially
      showFlowInfo();
    }

    function getNodeColor(type) {
      const colors = ${JSON.stringify(nodeColors)};
      return colors[type] || '#607D8B';
    }

    function truncateText(text, maxLength) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function selectNode(nodeId) {
      selectedNodeId = nodeId;

      // Update visual selection
      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('selected');
      });
      document.querySelector(\`[data-node-id="\${nodeId}"]\`)?.classList.add('selected');

      // Show properties
      const node = flowModel.nodes.find(n => n.id === nodeId);
      if (node) {
        showProperties(node);
      }
    }

    function showFlowInfo() {
      if (!flowModel || !flowModel.metadata) {
        return;
      }

      const panel = document.getElementById('propertiesPanel');

      let html = '<div class="flow-header">';
      html += \`<div class="flow-title">\${escapeHtml(flowModel.metadata.name)}</div>\`;
      if (flowModel.metadata.description) {
        html += \`<div class="flow-description">\${escapeHtml(flowModel.metadata.description)}</div>\`;
      }
      html += '</div>';
      html += '<div class="no-selection">Click a node to view its properties</div>';

      panel.innerHTML = html;
    }

    function showProperties(node) {
      const panel = document.getElementById('propertiesPanel');

      let html = '<div class="flow-header">';
      html += \`<div class="node-badge" style="background-color: \${getNodeColor(node.type)}; color: white;">\${node.type.split('.')[0].replace('ComIbm', '')}</div>\`;
      html += \`<div class="flow-title">\${escapeHtml(node.label)}</div>\`;
      html += '</div>';

      // General properties
      html += '<div class="property-section">';
      html += '<h3>General</h3>';
      html += \`<div class="property-row"><div class="property-label">ID</div><div class="property-value">\${escapeHtml(node.id)}</div></div>\`;
      html += \`<div class="property-row"><div class="property-label">Type</div><div class="property-value">\${escapeHtml(node.type)}</div></div>\`;
      html += \`<div class="property-row"><div class="property-label">Location</div><div class="property-value">x: \${node.location.x}, y: \${node.location.y}</div></div>\`;
      html += '</div>';

      // Terminals
      if (node.terminals.length > 0) {
        html += '<div class="property-section">';
        html += '<h3>Terminals</h3>';
        html += '<ul class="terminal-list">';
        node.terminals.forEach(terminal => {
          html += \`<li class="terminal-item">\`;
          html += \`<span class="terminal-direction \${terminal.direction}"></span>\`;
          html += \`<span>\${escapeHtml(terminal.label || terminal.name)}</span>\`;
          html += '</li>';
        });
        html += '</ul>';
        html += '</div>';
      }

      // Node-specific properties
      if (Object.keys(node.properties).length > 0) {
        html += '<div class="property-section">';
        html += '<h3>Properties</h3>';
        for (const [key, value] of Object.entries(node.properties)) {
          if (value !== undefined && value !== null && value !== '') {
            html += \`<div class="property-row"><div class="property-label">\${escapeHtml(key)}</div><div class="property-value">\${escapeHtml(String(value))}</div></div>\`;
          }
        }
        html += '</div>';
      }

      panel.innerHTML = html;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
  }
}
