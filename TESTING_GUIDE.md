# Quick Start: Testing Context-Aware LSP Features

## Setup

1. The code is already compiled and ready to test
2. Load the extension in VS Code (via Extension Host or F5 debug)
3. Open an `.esql` file

---

## Test 1: Scope-Aware Completions

### Setup
Open `test-context-aware.esql` and navigate to the line:
```esql
WHILE count < 10 DO
  DECLARE loopVar VARCHAR;
  SET loopVar = 'Inside loop';
```

### Test
1. After the loop ends, place cursor at a blank line inside the outer BEGIN block
2. Type `SET x = ` and press Ctrl+Space
3. **Expected**: 
   - ✅ See `globalVar` and `count` in suggestions
   - ❌ Do NOT see `loopVar` (it's out of scope)

### Verification
- Hover over `loopVar` suggestion in the completion list
- Should show detail: "Local variable (GLOBAL > DemoModule)"

---

## Test 2: Message Tree Completions

### Setup
Open `test-context-aware.esql`, find the line:
```esql
SET OutputRoot.MQ.Mq_Header.Encoding = InputRoot.MQ.Mq_Header.Encoding;
```

### Test: Message Root Completion
1. On a new line, type: `SET OutputRoot.`
2. Press Ctrl+Space
3. **Expected**:
   - ✅ See suggestions: MQ, HTTP, JMS, XMLNSC, JSON_d, Environment, LocalEnvironment, ExceptionList

### Test: Message Field Completion
1. Type: `SET OutputRoot.MQ.`
2. Press Ctrl+Space
3. **Expected**:
   - ✅ See suggestions: Mq_Header, Mq_MessageProperties

### Test: Message Hover
1. Place cursor on `Mq_Header` in existing code
2. Hover (Ctrl+K Ctrl+I or mouse)
3. **Expected**:
   - ✅ Tooltip shows: "**Mq_Header** (STRUCTURE)\n\nMQ Message Header (MQMD structure)"

---

## Test 3: Go-to-Definition

### Setup
Open `test-context-aware.esql`

### Test: Variable Definition
1. Find the line: `SET globalVar = 'Hello';` (around line 12)
2. Click on `globalVar`
3. Press Ctrl+Click (or F12 for "Go to Definition")
4. **Expected**:
   - ✅ Jumps to line with `DECLARE globalVar VARCHAR;`
   - ✅ Cursor is on the variable name

### Test: Function Definition
1. Find the line: `CALL Proc2;` (if you add it)
2. Ctrl+Click on `Proc2`
3. **Expected**:
   - ✅ Jumps to `CREATE PROCEDURE Proc2` line

### Test: Scoped Variable
1. Find the line inside the WHILE loop with `SET loopVar = 'Inside loop';`
2. Ctrl+Click on `loopVar`
3. **Expected**:
   - ✅ Jumps to `DECLARE loopVar VARCHAR;` inside the loop

---

## Test 4: Hover on Local Variables

### Setup
Open `test-context-aware.esql`

### Test
1. Hover over `globalVar` in the module
2. **Expected**:
   - ✅ Shows: "**globalVar** (Local variable)\n\nDeclared in: GLOBAL > DemoModule\n\nLine X"
3. Hover over `loopVar` inside the loop
4. **Expected**:
   - ✅ Shows: "**loopVar** (Local variable)\n\nDeclared in: GLOBAL > DemoModule\n\nLine X"

---

## Test 5: Message Root Hover

### Test
1. Hover over `InputRoot` or `OutputRoot` in existing code
2. **Expected**:
   - ✅ Shows available fields: MQ, HTTP, JMS, etc.
   - ✅ Labeled as "Message root"

---

## Troubleshooting

### Feature Not Working?

1. **Build not updated**: Run `npm run compile` and reload the extension
   
2. **LSP not connecting**: Check VS Code output panel (Extension Host)
   - Look for "ESQL Language & ACE Flow Visualizer extension is now active"
   - Check for TypeScript errors

3. **Completions not showing**:
   - Try pressing Ctrl+Space explicitly
   - Ensure you have an open ESQL file with `.esql` extension

4. **Go-to-Definition not working**:
   - Ensure definition provider capability was added (see server initialization)
   - Try F12 key instead of Ctrl+Click

---

## Expected Limitations

- ❌ Cross-file definitions not supported (all definitions must be in same file)
- ❌ Type inference not implemented (no type-specific completions beyond message paths)
- ❌ Custom message schemas not yet supported (using hardcoded paths)
- ✅ All features work within a single ESQL file

---

## Next Steps After Testing

1. **If all tests pass**: ✅ Ready for release
   - Create a git commit summarizing the changes
   - Update README if needed

2. **If issues found**:
   - Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
   - Review changes in `server/src/server.ts` and `src/messageTreeSchema.ts`

3. **Future enhancements**:
   - Cross-file navigation (track imported modules)
   - Type inference system
   - Custom message schema loading from flow metadata
   - Rename refactoring support
