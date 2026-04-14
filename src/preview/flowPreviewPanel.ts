/**
 * Preview Panel for IBM ACE Flow files - similar to Markdown preview
 */

import * as vscode from 'vscode';
import { FlowParser } from '../parser/flowParser';
import { FlowModel, NODE_TYPE_INFO } from '../models/flowModel';

export class FlowPreviewPanel {
  private static readonly viewType = 'aceFlowPreview';
  private static activePreviews = new Map<string, FlowPreviewPanel>();
  private static currentPreview: FlowPreviewPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly parser: FlowParser;
  private disposables: vscode.Disposable[] = [];
  private documentUri: vscode.Uri;
  private navigationHistory: Array<{ uri: vscode.Uri; label: string }> = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    documentUri: vscode.Uri,
    viewColumn?: vscode.ViewColumn,
  ): FlowPreviewPanel {
    const key = documentUri.toString();

    // If we already have a preview for this document, show it
    const existingPanel = FlowPreviewPanel.activePreviews.get(key);
    if (existingPanel) {
      existingPanel.panel.reveal(viewColumn);
      FlowPreviewPanel.currentPreview = existingPanel;
      return existingPanel;
    }

    // Otherwise, create a new preview
    const panel = new FlowPreviewPanel(
      extensionUri,
      documentUri,
      viewColumn || vscode.ViewColumn.Two,
    );
    FlowPreviewPanel.activePreviews.set(key, panel);
    FlowPreviewPanel.currentPreview = panel;
    return panel;
  }

  public static updateCurrentPreview(documentUri: vscode.Uri): void {
    if (
      FlowPreviewPanel.currentPreview &&
      FlowPreviewPanel.currentPreview.panel.visible
    ) {
      FlowPreviewPanel.currentPreview.updateDocument(documentUri);
    }
  }

  public static hasVisiblePreview(): boolean {
    return (
      FlowPreviewPanel.currentPreview !== undefined &&
      FlowPreviewPanel.currentPreview.panel.visible
    );
  }

  private constructor(
    extensionUri: vscode.Uri,
    documentUri: vscode.Uri,
    viewColumn: vscode.ViewColumn,
  ) {
    this.extensionUri = extensionUri;
    this.documentUri = documentUri;
    this.parser = new FlowParser();

    const fileName = documentUri.path.split('/').pop() || 'Flow';

    // Create and show webview panel
    this.panel = vscode.window.createWebviewPanel(
      FlowPreviewPanel.viewType,
      `Preview: ${fileName}`,
      viewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
      },
    );

    // Set initial content
    this.update();

    // Listen for when the panel is disposed
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Track when this panel becomes visible
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible) {
          FlowPreviewPanel.currentPreview = this;
        }
      },
      null,
      this.disposables,
    );

    // Update content when document changes
    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === this.documentUri.toString()) {
          this.update();
        }
      },
      null,
      this.disposables,
    );

    // Update when active editor changes (to track the correct document)
    vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        if (
          editor &&
          editor.document.uri.toString() === this.documentUri.toString()
        ) {
          this.update();
        }
      },
      null,
      this.disposables,
    );

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'openSource':
            // Open the source file
            vscode.window.showTextDocument(
              this.documentUri,
              vscode.ViewColumn.One,
            );
            break;
          case 'openNodeFile':
            await this.openNodeFile(message.node);
            break;
          case 'navigateBack':
            this.navigateBack();
            break;
          case 'navigateTo':
            this.navigateTo(message.index);
            break;
        }
      },
      null,
      this.disposables,
    );
  }

  public updateDocument(documentUri: vscode.Uri, addToHistory: boolean = true) {
    // Remove from old key
    const oldKey = this.documentUri.toString();
    FlowPreviewPanel.activePreviews.delete(oldKey);

    // Add current document to history before navigating
    if (addToHistory) {
      const currentFileName = this.documentUri.path.split('/').pop() || 'Flow';
      this.navigationHistory.push({
        uri: this.documentUri,
        label: currentFileName,
      });
    }

    // Update to new document
    this.documentUri = documentUri;
    const fileName = documentUri.path.split('/').pop() || 'Flow';
    this.panel.title = `Preview: ${fileName}`;

    // Add to new key
    const newKey = documentUri.toString();
    FlowPreviewPanel.activePreviews.set(newKey, this);

    // Update content
    this.update();
  }

  private navigateBack(): void {
    if (this.navigationHistory.length > 0) {
      const previous = this.navigationHistory.pop()!;
      this.updateDocument(previous.uri, false);

      // Also open the file in the editor
      vscode.window.showTextDocument(previous.uri, vscode.ViewColumn.One);
    }
  }

  private navigateTo(index: number): void {
    if (index >= 0 && index < this.navigationHistory.length) {
      // Remove everything after the selected index
      const targetHistory = this.navigationHistory.slice(0, index + 1);
      const target = targetHistory.pop()!;
      this.navigationHistory = targetHistory;
      this.updateDocument(target.uri, false);

      // Also open the file in the editor
      vscode.window.showTextDocument(target.uri, vscode.ViewColumn.One);
    }
  }

  private async update() {
    try {
      const document = await vscode.workspace.openTextDocument(
        this.documentUri,
      );
      const xmlContent = document.getText();
      const flowModel = this.parser.parse(xmlContent);

      this.panel.webview.html = this.getHtmlContent(
        this.panel.webview,
        flowModel,
      );
    } catch (error: any) {
      this.panel.webview.html = this.getErrorHtml(error.message);
    }
  }

  private getHtmlContent(
    webview: vscode.Webview,
    flowModel: FlowModel,
  ): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css'),
    );

    // Create color mapping for nodes
    const nodeColors: Record<string, string> = {};
    for (const [type, info] of Object.entries(NODE_TYPE_INFO)) {
      nodeColors[type] = info.color;
    }

    const flowData = JSON.stringify(flowModel);
    const navigationData = JSON.stringify(
      this.navigationHistory.map((h) => h.label),
    );
    const currentFileName = this.documentUri.path.split('/').pop() || 'Flow';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>ACE Flow Preview</title>
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
      display: flex;
      flex-direction: column;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .diagram-panel {
      flex: 1;
      overflow: auto;
      background: var(--vscode-editor-background);
      position: relative;
      min-height: 0;
    }

    .properties-panel {
      height: 250px;
      overflow-y: auto;
      background: var(--vscode-sideBar-background);
      border-top: 1px solid var(--vscode-panel-border);
      padding: 16px;
      flex-shrink: 0;
      position: relative;
    }

    .zoom-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 4px;
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 4px;
      z-index: 100;
    }

    .zoom-button {
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 3px;
      font-size: 14px;
      font-weight: bold;
      line-height: 1;
    }

    .zoom-button:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .zoom-level {
      padding: 6px 8px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 500;
      min-width: 45px;
      text-align: center;
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

    .node-label {
      fill: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      pointer-events: none;
      user-select: none;
    }

    .sticky-note {
      background-color: #FFEB3B;
      color: #000000;
      padding: 8px;
      border: 1px solid #FBC02D;
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 11px;
      line-height: 1.4;
      overflow: auto;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .connection {
      fill: none;
      stroke: var(--vscode-editorLineNumber-foreground);
      stroke-width: 1.5;
      cursor: pointer;
    }

    .connection:hover {
      stroke: var(--vscode-focusBorder);
      stroke-width: 2.5;
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

    .connection-tooltip {
      position: fixed;
      background: var(--vscode-editorHoverWidget-background);
      border: 1px solid var(--vscode-editorHoverWidget-border);
      color: var(--vscode-editorHoverWidget-foreground);
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      display: none;
      white-space: nowrap;
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

    .breadcrumb-bar {
      padding: 8px 16px;
      background: var(--vscode-titleBar-inactiveBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      flex-shrink: 0;
    }

    .breadcrumb-back {
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      font-size: 14px;
    }

    .breadcrumb-back:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .breadcrumb-back:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .breadcrumb-items {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      overflow-x: auto;
    }

    .breadcrumb-item {
      background: none;
      border: none;
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 2px;
      white-space: nowrap;
    }

    .breadcrumb-item:hover {
      background: var(--vscode-list-hoverBackground);
      text-decoration: underline;
    }

    .breadcrumb-separator {
      color: var(--vscode-descriptionForeground);
    }

    .breadcrumb-current {
      color: var(--vscode-foreground);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="breadcrumb-bar" id="breadcrumbBar">
      <button class="breadcrumb-back" id="backButton" title="Go back" disabled>◀</button>
      <div class="breadcrumb-items" id="breadcrumbItems">
        <span class="breadcrumb-current">${this.escapeHtml(currentFileName)}</span>
      </div>
    </div>
    <div class="diagram-panel" id="diagramPanel">
      <div class="zoom-controls">
        <button class="zoom-button" id="zoomOut" title="Zoom Out">−</button>
        <div class="zoom-level" id="zoomLevel">100%</div>
        <button class="zoom-button" id="zoomIn" title="Zoom In">+</button>
        <button class="zoom-button" id="zoomReset" title="Reset Zoom">⊙</button>
      </div>
      <svg id="flowDiagram"></svg>
      <div id="connectionTooltip" class="connection-tooltip"></div>
    </div>
    <div class="properties-panel" id="propertiesPanel">
      <div class="flow-header">
        <div class="flow-title">${this.escapeHtml(flowModel.metadata.name)}</div>
        ${flowModel.metadata.description ? `<div class="flow-description">${this.escapeHtml(flowModel.metadata.description)}</div>` : ''}
      </div>
      <div class="no-selection">
        Click a node to view its properties
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const flowModel = ${flowData};
    const navigationHistory = ${navigationData};
    const currentFileName = ${JSON.stringify(currentFileName)};
    let selectedNodeId = null;
    let zoomLevel = 1.0;
    let baseSvgWidth = 800;
    let baseSvgHeight = 600;
    let baseViewBox = { minX: 0, minY: 0, width: 800, height: 600 };

    // Initialize breadcrumbs
    function updateBreadcrumbs() {
      const backButton = document.getElementById('backButton');
      const breadcrumbItems = document.getElementById('breadcrumbItems');

      // Enable/disable back button
      backButton.disabled = navigationHistory.length === 0;

      // Build breadcrumb trail
      let html = '';
      navigationHistory.forEach((label, index) => {
        html += \`<button class="breadcrumb-item" onclick="navigateTo(\${index})">\${escapeHtml(label)}</button>\`;
        html += '<span class="breadcrumb-separator">/</span>';
      });
      html += \`<span class="breadcrumb-current">\${escapeHtml(currentFileName)}</span>\`;

      breadcrumbItems.innerHTML = html;
    }

    // Navigation functions
    function navigateBack() {
      vscode.postMessage({ type: 'navigateBack' });
    }

    function navigateTo(index) {
      vscode.postMessage({ type: 'navigateTo', index: index });
    }

    // Set up back button
    document.getElementById('backButton').addEventListener('click', navigateBack);

    // Initialize breadcrumbs on load
    updateBreadcrumbs();

    // Zoom functionality
    function updateZoom() {
      const svg = document.getElementById('flowDiagram');
      const zoomLevelDisplay = document.getElementById('zoomLevel');

      // Calculate new viewBox dimensions
      const centerX = baseViewBox.minX + baseViewBox.width / 2;
      const centerY = baseViewBox.minY + baseViewBox.height / 2;
      const newWidth = baseViewBox.width / zoomLevel;
      const newHeight = baseViewBox.height / zoomLevel;
      const newMinX = centerX - newWidth / 2;
      const newMinY = centerY - newHeight / 2;

      svg.setAttribute('viewBox', \`\${newMinX} \${newMinY} \${newWidth} \${newHeight}\`);
      zoomLevelDisplay.textContent = Math.round(zoomLevel * 100) + '%';
    }

    function zoomIn() {
      zoomLevel = Math.min(zoomLevel * 1.25, 5.0);
      updateZoom();
    }

    function zoomOut() {
      zoomLevel = Math.max(zoomLevel / 1.25, 0.1);
      updateZoom();
    }

    function zoomReset() {
      zoomLevel = 1.0;
      updateZoom();
    }

    // Set up zoom buttons
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    document.getElementById('zoomReset').addEventListener('click', zoomReset);

    // Properties panel when a node is selected
    function showPropertiesPanel() {
      const diagramPanel = document.getElementById('diagramPanel');
      const propertiesPanel = document.getElementById('propertiesPanel');

      // Store the current scroll position
      const scrollTop = diagramPanel.scrollTop;
      const scrollLeft = diagramPanel.scrollLeft;

      // Show the properties panel
      propertiesPanel.classList.remove('hidden');

      // Restore scroll position after the DOM has updated
      requestAnimationFrame(() => {
        diagramPanel.scrollTop = scrollTop;
        diagramPanel.scrollLeft = scrollLeft;
      });
    }

    // Hide properties panel
    function hidePropertiesPanel() {
      const diagramPanel = document.getElementById('diagramPanel');
      const propertiesPanel = document.getElementById('propertiesPanel');

      // Store the current scroll position
      const scrollTop = diagramPanel.scrollTop;
      const scrollLeft = diagramPanel.scrollLeft;

      // Hide the properties panel
      propertiesPanel.classList.add('hidden');

      // Restore scroll position after the DOM has updated
      requestAnimationFrame(() => {
        diagramPanel.scrollTop = scrollTop;
        diagramPanel.scrollLeft = scrollLeft;
      });

      // Clear selection
      selectedNodeId = null;
      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('selected');
      });
    }

    // Render the flow diagram
    function renderFlow() {
      if (!flowModel || !flowModel.nodes) {
        return;
      }

      const svg = document.getElementById('flowDiagram');
      const nodes = flowModel.nodes;
      const connections = flowModel.connections;

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.location.x);
        minY = Math.min(minY, node.location.y);
        maxX = Math.max(maxX, node.location.x + 120);
        maxY = Math.max(maxY, node.location.y + 90); // Extra space for label below node
      });

      // Include sticky notes in bounds calculation
      if (flowModel.stickyNotes && flowModel.stickyNotes.length > 0) {
        flowModel.stickyNotes.forEach(note => {
          minX = Math.min(minX, note.location.x);
          minY = Math.min(minY, note.location.y);
          maxX = Math.max(maxX, note.location.x + 300); // sticky note width
          maxY = Math.max(maxY, note.location.y + 120); // sticky note height
        });
      }

      const padding = 50;
      const width = maxX - minX + 2 * padding;
      const height = maxY - minY + 2 * padding;

      // Store base viewBox for zoom functionality
      baseViewBox = { minX: minX - padding, minY: minY - padding, width: width, height: height };
      baseSvgWidth = Math.max(width, 800);
      baseSvgHeight = Math.max(height, 600);

      svg.setAttribute('viewBox', \`\${minX - padding} \${minY - padding} \${width} \${height}\`);
      svg.setAttribute('width', baseSvgWidth);
      svg.setAttribute('height', baseSvgHeight);

      // Create fragment for batch DOM operations
      const fragment = document.createDocumentFragment();

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
      fragment.appendChild(defs);

      // Pre-index nodes for faster lookup
      const nodeMap = new Map();
      nodes.forEach(node => nodeMap.set(node.id, node));

      // Render connections
      connections.forEach(conn => {
        const sourceNode = nodeMap.get(conn.sourceNodeId);
        const targetNode = nodeMap.get(conn.targetNodeId);

        if (sourceNode && targetNode) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const startX = sourceNode.location.x + 50;
          const startY = sourceNode.location.y + 20;
          const endX = targetNode.location.x;
          const endY = targetNode.location.y + 20;

          let d = \`M \${startX} \${startY}\`;

          // Add bend points if they exist
          if (conn.bendPoints && conn.bendPoints.length > 0) {
            // Bendpoints are stored as relative offsets:
            // First bendpoint is relative to the source node position
            // Second bendpoint (if exists) is relative to the target node position
            conn.bendPoints.forEach((bendPoint, index) => {
              let absoluteX, absoluteY;
              if (index === 0) {
                // First bendpoint is relative to source
                absoluteX = sourceNode.location.x + bendPoint.x;
                absoluteY = sourceNode.location.y + bendPoint.y;
              } else {
                // Second and subsequent bendpoints are relative to target
                absoluteX = targetNode.location.x + bendPoint.x;
                absoluteY = targetNode.location.y + bendPoint.y;
              }
              d += \` L \${absoluteX} \${absoluteY}\`;
            });
            // Draw line to end point
            d += \` L \${endX} \${endY}\`;
          } else {
            // No bend points, use smooth curve
            const midX = (startX + endX) / 2;
            d = \`M \${startX} \${startY} Q \${midX} \${startY}, \${midX} \${(startY + endY) / 2} T \${endX} \${endY}\`;
          }

          path.setAttribute('d', d);
          path.setAttribute('class', 'connection');
          path.setAttribute('marker-end', 'url(#arrowhead)');

          // Store tooltip data
          const sourceTerminal = conn.sourceTerminal ? (conn.sourceTerminal.split('.').pop() || conn.sourceTerminal) : 'unknown';
          const targetTerminal = conn.targetTerminal ? (conn.targetTerminal.split('.').pop() || conn.targetTerminal) : 'unknown';
          path.setAttribute('data-tooltip', \`\${sourceTerminal} → \${targetTerminal}\`);

          fragment.appendChild(path);
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
        rect.setAttribute('width', '50');
        rect.setAttribute('height', '40');
        rect.setAttribute('fill', getNodeColor(node.type));

        // Add SVG icon inside the node
        const iconSvg = getNodeIcon(node.type);
        const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        iconGroup.setAttribute('transform', \`translate(\${node.location.x + 25}, \${node.location.y + 20})\`);
        iconGroup.innerHTML = iconSvg;

        // Add label below the node
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', node.location.x + 25);
        label.setAttribute('y', node.location.y + 52);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('class', 'node-label');
        label.textContent = node.label;

        g.appendChild(rect);
        g.appendChild(iconGroup);
        g.appendChild(label);

        g.addEventListener('click', () => selectNode(node.id));
        g.addEventListener('dblclick', () => {
          vscode.postMessage({ type: 'openNodeFile', node: node });
        });

        fragment.appendChild(g);
      });

      // Render sticky notes
      if (flowModel.stickyNotes && flowModel.stickyNotes.length > 0) {
        console.log('Rendering', flowModel.stickyNotes.length, 'sticky notes');
        flowModel.stickyNotes.forEach(note => {
          console.log('Sticky note at', note.location.x, note.location.y, 'body length:', note.body.length);
          const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          foreignObject.setAttribute('x', String(note.location.x));
          foreignObject.setAttribute('y', String(note.location.y));
          foreignObject.setAttribute('width', '300');
          foreignObject.setAttribute('height', '120');

          const noteDiv = document.createElement('div');
          noteDiv.className = 'sticky-note';
          noteDiv.textContent = note.body;

          foreignObject.appendChild(noteDiv);
          fragment.appendChild(foreignObject);
        });
      } else {
        console.log('No sticky notes to render');
      }

      // Replace all content at once for better performance
      svg.innerHTML = '';
      svg.appendChild(fragment);

      // Add instant tooltip handlers to connections
      const tooltip = document.getElementById('connectionTooltip');
      document.querySelectorAll('.connection').forEach(conn => {
        conn.addEventListener('mouseenter', (e) => {
          const text = conn.getAttribute('data-tooltip');
          if (tooltip && text) {
            tooltip.textContent = text;
            tooltip.style.display = 'block';
          }
        });
        conn.addEventListener('mousemove', (e) => {
          if (tooltip) {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
          }
        });
        conn.addEventListener('mouseleave', () => {
          if (tooltip) {
            tooltip.style.display = 'none';
          }
        });
      });
    }

    function getNodeColor(type) {
      const colors = ${JSON.stringify(nodeColors)};

      // Direct match
      if (colors[type]) {
        return colors[type];
      }

      // Try to extract base type (e.g., "ComIbmLabel.msgnode:FCMComposite_1" -> "ComIbmLabel.msgnode")
      if (type.includes(':')) {
        const baseType = type.split(':')[0];
        if (colors[baseType]) {
          return colors[baseType];
        }
      }

      // Try to match by checking if any color key is a prefix of the type
      for (const [key, color] of Object.entries(colors)) {
        if (type.startsWith(key)) {
          return color;
        }
      }

      return '#607D8B';
    }

    function getNodeIcon(type) {
      const baseType = type.includes(':') ? type.split(':')[0] : type;
      const iconSize = 24;
      const half = iconSize / 2;

      // Return SVG path elements (white fill, centered at 0,0)
      if (baseType.includes('ComIbmLabel')) {
        // Tag icon
        return \`<path d="M-10,-8 L8,-8 L12,0 L8,8 L-10,8 Z M4,-2 A2,2 0 1,1 4,2 A2,2 0 1,1 4,-2" fill="white"/>\`;
      }
      if (baseType.includes('ComIbmCompute')) {
        // Gear icon
        return \`<circle cx="0" cy="0" r="6" fill="white"/>
                <rect x="-2" y="-10" width="4" height="4" fill="white"/>
                <rect x="-2" y="6" width="4" height="4" fill="white"/>
                <rect x="-10" y="-2" width="4" height="4" fill="white"/>
                <rect x="6" y="-2" width="4" height="4" fill="white"/>\`;
      }
      if (baseType.includes('JavaCompute')) {
        // Coffee cup icon
        return \`<path d="M-8,-6 L8,-6 L6,6 C6,8 4,10 0,10 C-4,10 -6,8 -6,6 Z M8,-2 L12,-2 C12,2 10,4 8,4" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('MQInput') || baseType.includes('MQGet')) {
        // Inbox icon
        return \`<path d="M-10,-8 L10,-8 L10,8 L-10,8 Z M-10,0 L-4,0 L-2,4 L2,4 L4,0 L10,0" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('MQOutput')) {
        // Send icon
        return \`<path d="M-10,-8 L10,0 L-10,8 Z M0,0 L0,8" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>\`;
      }
      if (baseType.includes('HTTPRequest') || baseType.includes('WSRequest')) {
        // Globe icon
        return \`<circle cx="0" cy="0" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M0,-10 Q4,-5 0,0 Q-4,5 0,10 M0,-10 Q-4,-5 0,0 Q4,5 0,10 M-10,0 L10,0" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('HTTPReply') || baseType.includes('WSReply')) {
        // Reply arrow
        return \`<path d="M8,-8 L-8,0 L8,8 M-8,0 L10,0" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>\`;
      }
      if (baseType.includes('Filter')) {
        // Funnel icon
        return \`<path d="M-10,-8 L10,-8 L4,0 L4,10 L-4,10 L-4,0 Z" fill="white"/>\`;
      }
      if (baseType.includes('TryCatch')) {
        // Shield icon
        return \`<path d="M0,-10 L8,-6 L8,2 C8,6 4,10 0,10 C-4,10 -8,6 -8,2 L-8,-6 Z" fill="white"/>\`;
      }
      if (baseType.includes('Throw')) {
        // Warning triangle
        return \`<path d="M0,-10 L10,8 L-10,8 Z M-1,0 L1,0 L1,4 L-1,4 Z M0,6 A1,1 0 1,1 0,7 A1,1 0 1,1 0,6" fill="white"/>\`;
      }
      if (baseType.includes('Trace')) {
        // Document icon
        return \`<path d="M-6,-10 L4,-10 L8,-6 L8,10 L-6,10 Z M4,-10 L4,-6 L8,-6" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('ResetContentDescriptor')) {
        // Refresh icon
        return \`<path d="M8,-4 A6,6 0 1,0 8,4 M8,-6 L8,0 L2,0" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>\`;
      }
      if (baseType.includes('Scheduler')) {
        // Clock icon
        return \`<circle cx="0" cy="0" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M0,0 L0,-6 M0,0 L4,4" stroke="white" stroke-width="2" stroke-linecap="round"/>\`;
      }
      if (baseType.includes('SOAP')) {
        // Envelope icon
        return \`<path d="M-10,-6 L10,-6 L10,8 L-10,8 Z M-10,-6 L0,2 L10,-6" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('FCMSource')) {
        // Play icon
        return \`<path d="M-6,-8 L8,0 L-6,8 Z" fill="white"/>\`;
      }
      if (baseType.includes('FCMSink')) {
        // Stop icon
        return \`<rect x="-8" y="-8" width="16" height="16" fill="white"/>\`;
      }
      if (baseType.includes('Subflow') || baseType.includes('SubFlow')) {
        // Package icon
        return \`<path d="M-8,-8 L8,-8 L8,8 L-8,8 Z M-8,0 L8,0 M0,-8 L0,8" fill="none" stroke="white" stroke-width="2"/>\`;
      }

      // Default: circle
      return \`<circle cx="0" cy="0" r="8" fill="white"/>\`;
    }

    function truncateText(text, maxLength) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function selectNode(nodeId) {
      selectedNodeId = nodeId;

      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('selected');
      });
      document.querySelector(\`[data-node-id="\${nodeId}"]\`)?.classList.add('selected');

      const node = flowModel.nodes.find(n => n.id === nodeId);
      if (node) {
        showPropertiesPanel();
        showProperties(node);
      }
    }

    function showProperties(node) {
      const panel = document.getElementById('propertiesPanel');

      let html = '<div class="flow-header">';
      html += \`<div class="node-badge" style="background-color: \${getNodeColor(node.type)}; color: white;">\${node.type.split('.')[0].replace('ComIbm', '')}</div>\`;
      html += \`<div class="flow-title">\${escapeHtml(node.label)}</div>\`;
      html += '</div>';

      html += '<div class="property-section">';
      html += '<h3>General</h3>';
      html += \`<div class="property-row"><div class="property-label">ID</div><div class="property-value">\${escapeHtml(node.id)}</div></div>\`;
      html += \`<div class="property-row"><div class="property-label">Type</div><div class="property-value">\${escapeHtml(node.type)}</div></div>\`;
      html += \`<div class="property-row"><div class="property-label">Location</div><div class="property-value">x: \${node.location.x}, y: \${node.location.y}</div></div>\`;
      html += '</div>';

      // Show all connections for this node
      const incomingConns = flowModel.connections.filter(c => c.targetNodeId === node.id);
      const outgoingConns = flowModel.connections.filter(c => c.sourceNodeId === node.id);

      if (incomingConns.length > 0 || outgoingConns.length > 0) {
        html += '<div class="property-section">';
        html += '<h3>Connections</h3>';

        if (incomingConns.length > 0) {
          html += '<div style="margin-bottom: 8px;"><strong>Incoming:</strong></div>';
          html += '<ul class="terminal-list">';
          incomingConns.forEach(conn => {
            const sourceNode = flowModel.nodes.find(n => n.id === conn.sourceNodeId);
            const sourceTerminal = conn.sourceTerminal ? (conn.sourceTerminal.split('.').pop() || conn.sourceTerminal) : 'unknown';
            const targetTerminal = conn.targetTerminal ? (conn.targetTerminal.split('.').pop() || conn.targetTerminal) : 'unknown';
            html += \`<li class="terminal-item">\`;
            html += \`<span class="terminal-direction in"></span>\`;
            html += \`<span>\${escapeHtml(targetTerminal)} ← \${escapeHtml(sourceNode?.label || conn.sourceNodeId)} (\${escapeHtml(sourceTerminal)})</span>\`;
            html += '</li>';
          });
          html += '</ul>';
        }

        if (outgoingConns.length > 0) {
          html += '<div style="margin-bottom: 8px; margin-top: 12px;"><strong>Outgoing:</strong></div>';
          html += '<ul class="terminal-list">';
          outgoingConns.forEach(conn => {
            const targetNode = flowModel.nodes.find(n => n.id === conn.targetNodeId);
            const sourceTerminal = conn.sourceTerminal ? (conn.sourceTerminal.split('.').pop() || conn.sourceTerminal) : 'unknown';
            const targetTerminal = conn.targetTerminal ? (conn.targetTerminal.split('.').pop() || conn.targetTerminal) : 'unknown';
            html += \`<li class="terminal-item">\`;
            html += \`<span class="terminal-direction out"></span>\`;
            html += \`<span>\${escapeHtml(sourceTerminal)} → \${escapeHtml(targetNode?.label || conn.targetNodeId)} (\${escapeHtml(targetTerminal)})</span>\`;
            html += '</li>';
          });
          html += '</ul>';
        }

        html += '</div>';
      }

      if (Object.keys(node.properties).length > 0) {
        html += '<div class="property-section">';
        html += '<h3>Properties</h3>';
        for (const [key, value] of Object.entries(node.properties)) {
          if (value !== undefined && value !== null && value !== '') {
            const formattedValue = formatPropertyValue(key, value);
            html += \`<div class="property-row"><div class="property-label">\${escapeHtml(camelCaseToSentence(key))}</div><div class="property-value">\${escapeHtml(formattedValue)}</div></div>\`;
          }
        }
        html += '</div>';
      }

      panel.innerHTML = html;
    }

    function escapeHtml(text) {
      if (text === null || text === undefined) {
        return '';
      }
      const div = document.createElement('div');
      div.textContent = String(text);
      return div.innerHTML;
    }

    function camelCaseToSentence(text) {
      if (!text) return '';

      // Insert space before each capital letter, then trim and lowercase
      const withSpaces = text.replace(/([A-Z])/g, ' $1').trim();
      const lower = withSpaces.toLowerCase();

      // Capitalize only the first letter
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    function formatPropertyValue(key, value) {
      // Special handling for computeMode property
      if (key === 'computeMode' && typeof value === 'string') {
        const modeMap = {
          'destination': 'LocalEnvironment',
          'destinationAndMessage': 'LocalEnvironment and Message',
          'exception': 'Exception',
          'exceptionAndMessage': 'Exception and Message',
          'message': 'Message',
          'localEnvironmentAndException': 'Exception and LocalEnvironment',
          'all': 'All'
        };
        return modeMap[value] || value;
      }
      return String(value);
    }

    renderFlow();
  </script>
</body>
</html>`;
  }

  private getErrorHtml(errorMessage: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .error-container {
      text-align: center;
      padding: 40px;
    }
    .error-icon {
      font-size: 48px;
      color: var(--vscode-errorForeground);
      margin-bottom: 20px;
    }
    .error-message {
      color: var(--vscode-errorForeground);
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <div class="error-message">Failed to parse flow file</div>
    <div>${this.escapeHtml(errorMessage)}</div>
  </div>
</body>
</html>`;
  }

  private async openNodeFile(node: any) {
    try {
      let filePath: string | null = null;

      // Check if it's a Compute node with computeExpression
      if (node.properties?.computeExpression) {
        // Parse: esql://routine/sca.integration.scapulp#S4Invoice_PrepareRouting.Main
        const expr = node.properties.computeExpression;
        const match = expr.match(/esql:\/\/routine\/(.+)#(.+?)\.Main/);
        if (match) {
          const modulePath = match[1].replace(/\./g, '/'); // sca.integration.scapulp -> sca/integration/scapulp
          const fileName = match[2]; // S4Invoice_PrepareRouting
          filePath = `**/${modulePath}/${fileName}.esql`;
        }
      }

      // Check if it's a Subflow node
      if (!filePath && node.type.includes('.subflow:')) {
        // Parse: sca_integration_scapulp_S4InvoiceClaim.subflow:FCMComposite_1
        const subflowPath = node.type
          .split(':')[0]
          .replace(/_/g, '/')
          .replace('.subflow', '');
        filePath = `**/${subflowPath}.subflow`;
      }

      if (filePath) {
        // Search for the file in the workspace
        const files = await vscode.workspace.findFiles(filePath, null, 1);
        if (files.length > 0) {
          const document = await vscode.workspace.openTextDocument(files[0]);
          await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        } else {
          vscode.window.showWarningMessage(`Could not find file: ${filePath}`);
        }
      } else {
        vscode.window.showInformationMessage(
          'No associated file found for this node type',
        );
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error opening file: ${error.message}`);
    }
  }

  private escapeHtml(text: string | undefined | null): string {
    if (text === null || text === undefined) {
      return '';
    }
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public dispose() {
    const key = this.documentUri.toString();
    FlowPreviewPanel.activePreviews.delete(key);

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
