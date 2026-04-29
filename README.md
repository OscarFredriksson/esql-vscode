# IBM App Connect Enterprise Extension for VS Code

This extension provides ESQL syntax highlighting and a visual previewer for IBM App Connect Enterprise (ACE) / IBM Integration Bus (IIB) message flows and subflows.

## Features

### ESQL Language Server

Full language server support for `.esql` files, including:

- **Syntax highlighting** — keywords, types, built-in variables, operators, strings, and numeric literals
- **Completions** — all ESQL keywords, data types, built-in variables (`InputRoot`, `OutputRoot`, `Environment`, …), built-in functions (`CAST`, `CARDINALITY`, `SUBSTRING`, …), and user-defined modules/functions/procedures from the current file
- **Hover documentation** — signature and description for any keyword, type, or built-in under the cursor
- **Document symbols / Outline** — navigable tree of all `CREATE MODULE`, `CREATE FUNCTION`, and `CREATE PROCEDURE` declarations
- **Diagnostics** — warnings for unmatched `BEGIN`/`END` blocks, mismatched `CREATE MODULE`/`END MODULE`, and `DECLARE` statements missing a semicolon

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

Open any `.esql` file and the language server activates automatically:

- Press `Ctrl+Space` (or `Cmd+Space`) for completions
- Hover over any keyword, type, or built-in to see inline documentation
- Open the **Outline** panel in the Explorer sidebar to navigate modules and functions
- Diagnostics appear inline as you type

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
│   ├── extension.ts               # Extension activation + language client
│   ├── editor/
│   │   └── flowEditorProvider.ts  # Custom editor provider
│   ├── parser/
│   │   └── flowParser.ts          # XML/XMI parser for flow files
│   └── models/
│       └── flowModel.ts           # Type definitions
├── server/
│   └── src/
│       ├── server.ts              # ESQL language server (LSP)
│       └── esqlData.ts            # ESQL keywords, types, and built-in docs
├── media/
│   └── styles.css                 # Webview styles
├── syntaxes/
│   └── esql.tmLanguage.json       # ESQL TextMate grammar
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Credits

Created for visualization of IBM App Connect Enterprise message flows and subflows.

## Changelog

### 0.4.2

- Added GitHub Actions workflow for automated extension building and release
- Extension now builds and packages automatically on every push
- Built `.vsix` files available as artifacts and GitHub Releases

### 0.4.1

- Added local variable IntelliSense from `DECLARE` statements
- Added alias IntelliSense from `AS` and `CREATE ... AS/NAME` patterns
- Expanded keyword support and highlighting for `DO`, `OF`, `TYPE`, `NAME`, `NAMESPACE`, and `RETURNS`
- Improved semicolon diagnostics for `DECLARE`, `SET`, and bare `CREATE` statements, including multiline statements and end-of-file cases
- Added loop closing diagnostics for missing or unmatched `END WHILE/FOR/REPEAT/LOOP`

### 0.4.0

- **New**: ESQL Language Server (LSP) for `.esql` files
- Completions for all keywords, data types, built-in variables, and built-in functions — each with markdown documentation
- Hover documentation showing function signatures and descriptions
- Document symbols / Outline panel support for modules, functions, and procedures
- Diagnostics: unmatched `BEGIN`/`END`, mismatched `CREATE MODULE`/`END MODULE`, missing semicolons on `DECLARE`

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
