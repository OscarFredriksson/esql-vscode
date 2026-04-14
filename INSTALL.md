# Installation & Testing Guide

## Quick Install

To install the extension in VS Code:

```bash
cd /Users/oscar/dev/sca/esql-vscode
code --install-extension esql-language-0.3.0.vsix
```

Or manually:

1. Open VS Code
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX..."
4. Navigate to `/Users/oscar/dev/sca/esql-vscode/esql-language-0.3.0.vsix`
5. Select the file and install

## Testing the Flow Visualizer

After installation, test with actual flow files:

### Test with Subflow

```bash
# Open a subflow file in VS Code
code /Users/oscar/dev/sca/int-pulp-csm/ScaPulpCsmMessagesApp/sca/integration/scapulp/S4CheckResourceExists.subflow
```

### Test with Message Flow

```bash
# Open a message flow file (if available)
code /Users/oscar/dev/sca/int-logistics-external/SCALogisticsScopeMessagesApp/sca/integration/scalogistics/Acknowledgement.msgflow
```

## Expected Behavior

When you open a `.subflow` or `.msgflow` file:

1. **The file opens as a normal XML text editor** (not automatically as visualizer)
2. **Click the preview icon** (📄) in the editor toolbar (top-right corner)
3. **Visual preview opens to the side** with:
   - **Left side**: Flow diagram with nodes and connections
   - **Right side**: Properties inspector
4. **Edit the XML** and the preview updates automatically
5. **Click nodes** in the diagram to see their properties

## Features to Verify

- [ ] File opens as normal XML text editor
- [ ] Preview button (📄) appears in editor toolbar
- [ ] Clicking preview button opens visual panel to the side
- [ ] Flow diagram renders correctly with all nodes positioned
- [ ] Connections between nodes are drawn with arrows
- [ ] Nodes are color-coded by type (Compute=blue, MQ=orange, etc.)
- [ ] Editing XML updates the preview automatically after a brief delay
- [ ] Clicking a node shows its properties in the right panel
- [ ] Node properties include: ID, Type, Location, Terminals, and custom properties
- [ ] ESQL references are shown (e.g., `esql://routine/...`)
- [ ] Flow metadata appears at the top of the properties panel

## ESQL Syntax Highlighting

The extension also provides syntax highlighting for `.esql` files:

```bash
# Open an ESQL file
code /Users/oscar/dev/sca/int-pulp-csm/ScaPulpCsmMessagesApp/sca/integration/scapulp/S4CheckResourceExists_HandleCheckResponse.esql
```

Expected:

- Keywords highlighted in purple (BEGIN, END, IF, THEN, PROPAGATE, etc.)
- Built-in variables highlighted (InputRoot, OutputRoot, Environment)
- Comments in gray
- Strings in orange/red

## Troubleshooting

### Extension doesn't activate

- Check VS Code version (requires 1.80.0+)
- Reload VS Code: `Cmd+Shift+P` → "Reload Window"

### Preview button doesn't appear

- Make sure the file has `.msgflow` or `.subflow` extension
- The file should be recognized as XML
- Reload VS Code: `Cmd+Shift+P` → "Reload Window"

### Preview doesn't open

- Try using Command Palette: `Cmd+Shift+P` → "ACE Flow: Open Preview to the Side"
- Check the Developer Console: `Help` → `Toggle Developer Tools` → Console tab for errors

### Parse errors

- Check the Developer Console: `Help` → `Toggle Developer Tools`
- Look for error messages in the Console tab

## Development

To modify and rebuild:

```bash
cd /Users/oscar/dev/sca/esql-vscode

# Install dependencies
npm install

# Watch mode (auto-compile on save)
npm run watch

# Manual compile
npm run compile

# Package after changes
npm run package

# Reinstall updated extension
code --install-extension esql-language-0.1.0.vsix --force
```

## File Locations

- **Extension source**: `/Users/oscar/dev/sca/esql-vscode/src/`
- **Compiled output**: `/Users/oscar/dev/sca/esql-vscode/out/`
- **VSIX package**: `/Users/oscar/dev/sca/esql-vscode/esql-language-0.1.0.vsix`
- **Test files**:
  - Subflows: `/Users/oscar/dev/sca/int-pulp-csm/ScaPulpCsmMessagesApp/sca/integration/scapulp/*.subflow`
  - ESQL: `/Users/oscar/dev/sca/int-pulp-csm/ScaPulpCsmMessagesApp/sca/integration/scapulp/*.esql`

## Success Criteria

✅ Extension installs without errors
✅ Flow files open in visualizer (not text editor)
✅ Diagram renders with correct node positions
✅ Connections drawn between nodes
✅ Node selection updates properties panel
✅ No console errors in Developer Tools
✅ ESQL files show syntax highlighting

Enjoy exploring your ACE flows visually! 🎉
