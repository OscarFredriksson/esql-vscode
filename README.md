# IBM App Connect Enterprise Extension for VS Code

This extension provides ESQL syntax highlighting and a visual previewer for IBM App Connect Enterprise (ACE) / IBM Integration Bus (IIB) message flows and subflows.

## Features

### ESQL Syntax Highlighting

- Full syntax highlighting for `.esql` files
- Support for ESQL keywords, functions, built-in variables, and operators
- Line and block comments
- String and numeric literals

### ACE Flow Visualizer

- Visual preview panel for `.msgflow` (Message Flow) and `.subflow` (Subflow) files
- **Editor toolbar button**: Click "Open Preview to the Side" icon to open preview
- **Split-panel view**: XML editor on left, visual preview on right
- Real-time preview synchronization as you edit the XML
- Interactive node selection to view detailed properties
- SVG-based rendering with automatic layout and scaling
- Color-coded nodes by type:
  - 🟢 Green: Input/Output terminals
  - 🔵 Blue: Compute nodes
  - 🟠 Orange: MQ nodes
  - 🟣 Purple: HTTP/Web Service nodes
  - 🔴 Red: Error handling nodes
  - And more...

## Usage

### Viewing Flow Files

1. Open any `.msgflow` or `.subflow` file in VS Code (opens as normal XML text editor)
2. Click the **"Open Preview to the Side"** icon (📄) in the editor toolbar (top-right corner)
   - Or use Command Palette: `Cmd+Shift+P` → "ACE Flow: Open Preview to the Side"
3. The visual preview will open in a new editor panel beside your XML editor
4. Edit the XML and the preview updates automatically
5. Click on nodes in the diagram to view their properties in the properties panel
6. The diagram is automatically scaled to fit the viewport

### ESQL Files

Simply open any `.esql` file and enjoy syntax highlighting.

## Supported Node Types

The visualizer supports all common IBM ACE node types including:

- Flow terminals (Input/Output)
- Compute & JavaCompute
- MQ Input/Output/Get
- HTTP Request/Reply
- Web Service Input/Request/Reply
- Filter, Label
- Try/Catch, Throw
- Reset Content Descriptor
- SOAP nodes
- Scheduler
- Trace
- And many more...

## Requirements

- VS Code 1.80.0 or higher
- No additional dependencies required

## Known Limitations

- Flow files are editable but complex structural changes may break the visual preview until saved
- External ESQL code is not displayed inline (only references shown)
- Subflow references show as nodes but don't expand inline
- Very large flows (100+ nodes) may render slowly
- Changes in the XML editor have a short delay (~500ms) before the preview updates

## Installation

### From VSIX

1. Download the `.vsix` file
2. Open VS Code
3. Run: `Extensions: Install from VSIX...` from the Command Palette
4. Select the downloaded `.vsix` file

### From Source

```bash
cd esql-vscode
npm install
npm run compile
npx vsce package
code --install-extension esql-language-*.vsix
```

## Development

### Building

```bash
npm install
npm run compile
```

### Packaging

```bash
npm run package
```

### Watching for changes

```bash
npm run watch
```

## File Structure

```
esql-vscode/
├── src/
│   ├── extension.ts           # Extension activation
│   ├── editor/
│   │   └── flowEditorProvider.ts  # Custom editor provider
│   ├── parser/
│   │   └── flowParser.ts      # XML/XMI parser for flow files
│   └── models/
│       └── flowModel.ts       # Type definitions
├── media/
│   └── styles.css            # Webview styles
├── syntaxes/
│   └── esql.tmLanguage.json  # ESQL grammar
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Credits

Created for visualization of IBM App Connect Enterprise message flows and subflows.

## Changelog

### 0.3.0

- **Major Update**: Changed to preview panel model (like Markdown preview)
- Flow files now open as normal XML text editor
- Added "Open Preview to the Side" button in editor toolbar
- Preview panel updates in real-time as you edit
- Fixed bundling issue - all dependencies now included
- More intuitive workflow for editing and previewing

### 0.2.0

- **Major Update**: Split-view editor with live preview
- Left panel shows editable XML source
- Right panel shows visual flowchart with property inspector
- Real-time preview updates as you edit
- Improved error handling with inline error messages

### 0.1.0

- Initial release
- ESQL syntax highlighting
- ACE Flow Visualizer with split view
- Support for .msgflow and .subflow files
- Interactive property panel

---

**Enjoy visually exploring your ACE flows!** 🚀
