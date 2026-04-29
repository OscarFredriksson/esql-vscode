import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';

export interface ESQLDoc {
  signature?: string;
  documentation: string;
}

// ─── Keywords ────────────────────────────────────────────────────────────────

export const KEYWORD_DOCS: Record<string, ESQLDoc> = {
  BEGIN: {
    documentation:
      'Marks the start of a compound statement block. Must be paired with `END`.',
  },
  END: {
    documentation: 'Marks the end of a compound statement block.',
  },
  IF: {
    signature: 'IF <condition> THEN ... [ELSEIF ... THEN ...] [ELSE ...] END IF;',
    documentation: 'Conditional branching statement.',
  },
  THEN: { documentation: 'Separates the condition from the body of an IF statement.' },
  ELSE: { documentation: 'Defines the fallback branch of an IF statement.' },
  ELSEIF: {
    signature: 'ELSEIF <condition> THEN ...',
    documentation: 'Additional conditional branch in an IF statement.',
  },
  CASE: {
    signature: 'CASE [<expr>] WHEN <val> THEN ... [ELSE ...] END CASE;',
    documentation: 'Multi-way branching statement.',
  },
  WHEN: { documentation: 'Defines a branch in a CASE expression.' },
  WHILE: {
    signature: 'WHILE <condition> DO ... END WHILE;',
    documentation: 'Repeats a block while a condition is true.',
  },
  DO: { documentation: 'Begins the body of a WHILE or FOR loop.' },
  FOR: {
    signature: 'FOR <var> AS <cursor>[] DO ... END FOR;',
    documentation:
      'Iterates over repeating elements in the message tree. The cursor variable references each element in turn.',
  },
  REPEAT: {
    signature: 'REPEAT ... UNTIL <condition> END REPEAT;',
    documentation: 'Executes a block at least once, then repeats while condition is false.',
  },
  UNTIL: { documentation: 'Defines the exit condition of a REPEAT loop.' },
  LOOP: {
    signature: 'LOOP ... END LOOP;',
    documentation: 'Infinite loop. Use LEAVE to exit.',
  },
  LEAVE: {
    signature: 'LEAVE [<label>];',
    documentation: 'Exits the enclosing loop or block.',
  },
  ITERATE: {
    signature: 'ITERATE [<label>];',
    documentation: 'Skips to the next iteration of the enclosing loop.',
  },
  RETURN: {
    signature: 'RETURN [<expression>];',
    documentation: 'Returns a value from a FUNCTION, or exits a PROCEDURE.',
  },
  DECLARE: {
    signature: 'DECLARE <name> [SHARED] [EXTERNAL] <type> [<default>];',
    documentation:
      'Declares a variable, or declares a SHARED/EXTERNAL variable accessible across invocations.',
  },
  SET: {
    signature: 'SET <path> = <expression>;',
    documentation: 'Assigns a value to a variable or message-tree field.',
  },
  CALL: {
    signature: 'CALL <procedure>([<args>]) [INTO <var>];',
    documentation: 'Invokes a procedure.',
  },
  CREATE: {
    documentation: 'Creates a MODULE, FUNCTION, PROCEDURE, or message-tree element.',
  },
  MODULE: { documentation: 'Defines an ESQL module that groups functions and procedures.' },
  COMPUTE: {
    documentation:
      'Qualifier for a FUNCTION or MODULE that maps input to output messages.',
  },
  FUNCTION: {
    signature: 'CREATE [COMPUTE] FUNCTION <name>(<params>) [RETURNS <type>] BEGIN ... END;',
    documentation:
      'Defines an ESQL function. A COMPUTE FUNCTION named `Main` is the entry point for a Compute node.',
  },
  PROCEDURE: {
    signature: 'CREATE PROCEDURE <name>(<params>) [RETURNS <type>] [LANGUAGE ESQL] BEGIN ... END;',
    documentation: 'Defines an ESQL procedure (does not return a value by default).',
  },
  EXTERNAL: {
    documentation:
      'Declares a variable whose value is set via node properties (visible in the IIB/ACE node editor).',
  },
  SHARED: {
    documentation:
      'Declares a variable shared across all invocations of the flow (module-level state).',
  },
  ATOMIC: {
    documentation:
      'Makes a BEGIN ... END block execute atomically with respect to shared variables.',
  },
  HANDLER: {
    signature: 'DECLARE <name> HANDLER FOR <condition> BEGIN ... END;',
    documentation: 'Declares a condition handler for error recovery.',
  },
  CONTINUE: {
    documentation: 'Handler action: continues execution after the condition that raised the handler.',
  },
  SIGNAL: {
    signature: 'SIGNAL <condition> [SET MESSAGE VALUES(<...>)];',
    documentation: 'Raises a user-defined condition.',
  },
  RESIGNAL: {
    documentation: 'Re-raises the current condition from within a handler.',
  },
  THROW: {
    signature: 'THROW USER EXCEPTION [SEVERITY <n>] [CATALOG <s>] [MESSAGE <n>] VALUES(<...>);',
    documentation:
      'Throws a user exception. Useful for propagating structured errors to the ExceptionList.',
  },
  PROPAGATE: {
    signature: 'PROPAGATE [TO TERMINAL <name>] [MESSAGE ENVIRONMENT <env>];',
    documentation: 'Propagates the output message to a terminal.',
  },
  PASSTHRU: {
    signature: 'PASSTHRU(<sql> [TO <datasource>]);',
    documentation: 'Executes an arbitrary SQL statement against a database.',
  },
  SELECT: {
    signature: 'SELECT <cols> FROM <source>[] [WHERE <cond>]',
    documentation: 'Queries fields from repeating elements in the message tree or a database.',
  },
  FROM: { documentation: 'Specifies the source for a SELECT statement.' },
  WHERE: { documentation: 'Filters rows in a SELECT statement.' },
  INTO: { documentation: 'Specifies the target for an INSERT or SET statement.' },
  VALUES: { documentation: 'Supplies values for an INSERT statement.' },
  INSERT: {
    signature: 'INSERT INTO <target>[] VALUES (<vals>);',
    documentation: 'Inserts a row into a database table or appends an element to a repeating field.',
  },
  UPDATE: {
    signature: 'UPDATE <table> AS <alias> SET <col> = <val> [WHERE <cond>];',
    documentation: 'Updates rows in a database table.',
  },
  DELETE: {
    signature: 'DELETE FROM <table> [WHERE <cond>];',
    documentation: 'Deletes rows from a database table.',
  },
  GROUP: { documentation: 'Groups rows in a SELECT aggregate query.' },
  BY: { documentation: 'Used with GROUP BY or ORDER BY.' },
  HAVING: { documentation: 'Filters groups in a GROUP BY clause.' },
  ORDER: { documentation: 'Orders results of a SELECT statement.' },
  AS: { documentation: 'Aliases a field or expression in a SELECT statement.' },
  TO: { documentation: 'Specifies a destination (e.g., TO TERMINAL).' },
  AND: { documentation: 'Logical AND operator.' },
  OR: { documentation: 'Logical OR operator.' },
  NOT: { documentation: 'Logical NOT operator.' },
  IN: {
    signature: '<expr> IN (<val1>, <val2>, ...)',
    documentation: 'Tests whether a value is contained in a list.',
  },
  LIKE: {
    signature: '<expr> LIKE <pattern> [ESCAPE <char>]',
    documentation: 'Pattern matching operator. Use `%` for any sequence and `_` for any single character.',
  },
  BETWEEN: {
    signature: '<expr> BETWEEN <low> AND <high>',
    documentation: 'Tests whether a value lies within a range (inclusive).',
  },
  IS: { documentation: 'Tests for NULL: `<expr> IS [NOT] NULL`.' },
  EXISTS: {
    signature: 'EXISTS(<select>)',
    documentation: 'Returns TRUE if the subquery returns at least one row.',
  },
  NULLIF: {
    signature: 'NULLIF(<expr1>, <expr2>)',
    documentation: 'Returns NULL if expr1 equals expr2, otherwise returns expr1.',
  },
  COALESCE: {
    signature: 'COALESCE(<expr1>, <expr2>, ...)',
    documentation: 'Returns the first non-NULL expression in the list.',
  },
  USER: { documentation: 'Used in THROW USER EXCEPTION.' },
  EXCEPTION: { documentation: 'Used in THROW USER EXCEPTION.' },
  MESSAGE: { documentation: 'Used in THROW / SIGNAL to specify message catalog entry.' },
  TERMINAL: { documentation: 'Identifies an output terminal name in PROPAGATE.' },
  RETURNS: { documentation: 'Specifies the return type of a FUNCTION.' },
  LANGUAGE: { documentation: 'Specifies the implementation language (e.g., LANGUAGE ESQL, LANGUAGE DATABASE).' },
  ESQL: { documentation: 'Language identifier for ESQL procedures.' },
  DATABASE: { documentation: 'Specifies that a procedure is implemented by a database stored procedure.' },
  SEVERITY: { documentation: 'Severity level used in THROW USER EXCEPTION.' },
  CATALOG: { documentation: 'Message catalog identifier used in THROW USER EXCEPTION.' },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export const TYPE_DOCS: Record<string, ESQLDoc> = {
  BOOLEAN: { documentation: 'Logical value: TRUE or FALSE.' },
  BIT: { documentation: 'A single bit value.' },
  BLOB: { documentation: 'Binary Large Object — a sequence of bytes.' },
  CLOB: { documentation: 'Character Large Object — a large character string.' },
  CHARACTER: {
    signature: 'CHARACTER [VARYING] [(length)]',
    documentation: 'Fixed-length character string. Alias: CHAR.',
  },
  CHAR: { documentation: 'Alias for CHARACTER.' },
  VARCHAR: { documentation: 'Variable-length character string.' },
  NVARCHAR: { documentation: 'Variable-length Unicode character string.' },
  INTEGER: { documentation: 'A 32-bit signed integer value. Alias: INT.' },
  INT: { documentation: 'Alias for INTEGER.' },
  SMALLINT: { documentation: 'A 16-bit signed integer.' },
  BIGINT: { documentation: 'A 64-bit signed integer.' },
  DECIMAL: {
    signature: 'DECIMAL [(precision, scale)]',
    documentation: 'Exact numeric type with configurable precision and scale. Alias: NUMERIC.',
  },
  NUMERIC: { documentation: 'Alias for DECIMAL.' },
  FLOAT: { documentation: 'Single-precision floating-point number.' },
  DOUBLE: { documentation: 'Double-precision floating-point number.' },
  DATE: { documentation: 'Calendar date (year, month, day).' },
  TIME: { documentation: 'Time of day.' },
  TIMESTAMP: { documentation: 'Date and time combined.' },
  INTERVAL: {
    signature: 'INTERVAL (<n>) <unit>',
    documentation: 'Duration value (e.g., `INTERVAL(1) DAY`).',
  },
  ROW: { documentation: 'A single structured row — a named tuple of fields.' },
  LIST: { documentation: 'A list of values or rows.' },
  REFERENCE: { documentation: 'A reference (pointer) to a node in the message tree.' },
};

// ─── Built-in variables ───────────────────────────────────────────────────────

export const BUILTIN_VAR_DOCS: Record<string, ESQLDoc> = {
  InputRoot: {
    documentation:
      'The root of the input message tree. Access parsed message content via `InputRoot.<parser>.<element>`.',
  },
  OutputRoot: {
    documentation:
      'The root of the output message tree. Write fields here to build the outgoing message.',
  },
  InputBody: {
    documentation:
      'Shorthand for `InputRoot.<parser>` — the body of the input message.',
  },
  OutputBody: {
    documentation:
      'Shorthand for `OutputRoot.<parser>` — the body of the output message.',
  },
  Environment: {
    documentation:
      'The shared Environment tree. Data persists across nodes within the same flow instance.',
  },
  LocalEnvironment: {
    documentation:
      'The local environment tree. Scoped to the current flow path.',
  },
  InputLocalEnvironment: {
    documentation:
      'The local environment from the input side of the current node.',
  },
  OutputLocalEnvironment: {
    documentation:
      'The local environment passed to the next node.',
  },
  ExceptionList: {
    documentation:
      'The exception list tree — contains details of errors that occurred during processing.',
  },
  Database: {
    documentation:
      'Represents database result set data when using the Database node or PASSTHRU.',
  },
};

// ─── Built-in functions ───────────────────────────────────────────────────────

export const BUILTIN_FUNC_DOCS: Record<string, ESQLDoc> = {
  // String functions
  CAST: {
    signature: 'CAST(<expression> AS <type>)',
    documentation: 'Converts an expression to the specified ESQL data type.',
  },
  LENGTH: {
    signature: 'LENGTH(<string>)',
    documentation: 'Returns the number of characters in a string.',
  },
  SUBSTRING: {
    signature: 'SUBSTRING(<string> FROM <start> [FOR <length>])',
    documentation: 'Extracts a portion of a string starting at position `start` (1-based).',
  },
  OVERLAY: {
    signature: 'OVERLAY(<string> PLACING <replacement> FROM <start> [FOR <length>])',
    documentation: 'Replaces a portion of a string with another string.',
  },
  POSITION: {
    signature: 'POSITION(<needle> IN <haystack>)',
    documentation: 'Returns the 1-based character position of `needle` inside `haystack`, or 0 if not found.',
  },
  TRIM: {
    signature: 'TRIM([LEADING|TRAILING|BOTH] [<char>] FROM <string>)',
    documentation: 'Removes leading, trailing, or both occurrences of a character (default: space) from a string.',
  },
  LTRIM: {
    signature: 'LTRIM(<string>)',
    documentation: 'Removes leading whitespace from a string.',
  },
  RTRIM: {
    signature: 'RTRIM(<string>)',
    documentation: 'Removes trailing whitespace from a string.',
  },
  UCASE: {
    signature: 'UCASE(<string>)',
    documentation: 'Converts all characters in a string to upper case.',
  },
  LCASE: {
    signature: 'LCASE(<string>)',
    documentation: 'Converts all characters in a string to lower case.',
  },
  UPPER: {
    signature: 'UPPER(<string>)',
    documentation: 'Alias for UCASE — converts to upper case.',
  },
  LOWER: {
    signature: 'LOWER(<string>)',
    documentation: 'Alias for LCASE — converts to lower case.',
  },
  REPLICATE: {
    signature: 'REPLICATE(<string>, <count>)',
    documentation: 'Returns `string` repeated `count` times.',
  },
  SPACE: {
    signature: 'SPACE(<n>)',
    documentation: 'Returns a string of `n` space characters.',
  },
  LEFT: {
    signature: 'LEFT(<string>, <n>)',
    documentation: 'Returns the leftmost `n` characters of `string`.',
  },
  RIGHT: {
    signature: 'RIGHT(<string>, <n>)',
    documentation: 'Returns the rightmost `n` characters of `string`.',
  },
  REVERSE: {
    signature: 'REVERSE(<string>)',
    documentation: 'Returns the string with its characters in reverse order.',
  },
  // Numeric functions
  ABS: {
    signature: 'ABS(<number>)',
    documentation: 'Returns the absolute value of a number.',
  },
  ROUND: {
    signature: 'ROUND(<number>, <scale>)',
    documentation: 'Rounds `number` to `scale` decimal places.',
  },
  CEIL: {
    signature: 'CEIL(<number>)',
    documentation: 'Returns the smallest integer not less than `number` (ceiling).',
  },
  FLOOR: {
    signature: 'FLOOR(<number>)',
    documentation: 'Returns the largest integer not greater than `number` (floor).',
  },
  MOD: {
    signature: 'MOD(<dividend>, <divisor>)',
    documentation: 'Returns the remainder of `dividend / divisor`.',
  },
  POWER: {
    signature: 'POWER(<base>, <exponent>)',
    documentation: 'Returns `base` raised to `exponent`.',
  },
  SQRT: {
    signature: 'SQRT(<number>)',
    documentation: 'Returns the square root of a number.',
  },
  LOG: {
    signature: 'LOG(<number>)',
    documentation: 'Returns the natural logarithm of a number.',
  },
  EXP: {
    signature: 'EXP(<number>)',
    documentation: 'Returns e raised to the power of `number`.',
  },
  // Date/time functions
  CURRENT_TIMESTAMP: {
    signature: 'CURRENT_TIMESTAMP',
    documentation: 'Returns the current date and time as a TIMESTAMP.',
  },
  CURRENT_DATE: {
    signature: 'CURRENT_DATE',
    documentation: 'Returns the current date.',
  },
  CURRENT_TIME: {
    signature: 'CURRENT_TIME',
    documentation: 'Returns the current time.',
  },
  NOW: {
    signature: 'NOW()',
    documentation: 'Alias for CURRENT_TIMESTAMP.',
  },
  EXTRACT: {
    signature: 'EXTRACT(<part> FROM <datetime>)',
    documentation:
      'Extracts a component from a date/time value. Parts: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND.',
  },
  // Message tree functions
  CARDINALITY: {
    signature: 'CARDINALITY(<path>[])',
    documentation:
      'Returns the number of instances of a repeating field in the message tree.',
  },
  FIELDNAME: {
    signature: 'FIELDNAME(<field>)',
    documentation: 'Returns the local name of a message-tree field.',
  },
  FIELDNAMESPACE: {
    signature: 'FIELDNAMESPACE(<field>)',
    documentation: 'Returns the namespace URI of a message-tree field.',
  },
  FIELDTYPE: {
    signature: 'FIELDTYPE(<field>)',
    documentation: 'Returns the type of a message-tree field as an integer constant.',
  },
  FIELDVALUE: {
    signature: 'FIELDVALUE(<field>)',
    documentation: 'Returns the scalar value of a message-tree field.',
  },
  ASBITSTREAM: {
    signature: 'ASBITSTREAM(<tree> [OPTIONS <opts>] [ENCODING <enc>] [CCSID <ccsid>] [SET <set>] [TYPE <type>] [FORMAT <fmt>])',
    documentation:
      'Serializes a message-tree element to a BLOB using the specified parser options.',
  },
  BITSTREAM: {
    signature: 'BITSTREAM(<message>)',
    documentation: 'Returns the binary representation (BLOB) of the input message.',
  },
  // Encoding functions
  HEXADECIMAL: {
    signature: 'HEXADECIMAL(<blob>)',
    documentation: 'Converts a BLOB to its hexadecimal string representation.',
  },
  BASE64ENCODE: {
    signature: 'BASE64ENCODE(<blob>)',
    documentation: 'Encodes a BLOB to a Base64-encoded character string.',
  },
  BASE64DECODE: {
    signature: 'BASE64DECODE(<string>)',
    documentation: 'Decodes a Base64 character string to a BLOB.',
  },
  // Error/diagnostic variables
  SQLCODE: {
    signature: 'SQLCODE',
    documentation:
      'Contains the SQL return code from the most recent database operation. 0 = success, 100 = no rows found.',
  },
  SQLERRORTEXT: {
    signature: 'SQLERRORTEXT',
    documentation: 'Contains the error message text from the most recent failed database operation.',
  },
  SQLNATIVEERROR: {
    signature: 'SQLNATIVEERROR',
    documentation: 'Contains the native database error code from the most recent failed operation.',
  },
  SQLSTATE: {
    signature: 'SQLSTATE',
    documentation: 'Contains the SQLSTATE code (5-character string) from the most recent database operation.',
  },
};

// ─── Completion item builders ─────────────────────────────────────────────────

export function buildKeywordCompletions(): CompletionItem[] {
  return Object.keys(KEYWORD_DOCS).map((kw) => ({
    label: kw,
    kind: CompletionItemKind.Keyword,
    detail: 'ESQL keyword',
    documentation: {
      kind: 'markdown',
      value: formatDoc(KEYWORD_DOCS[kw]),
    },
  }));
}

export function buildTypeCompletions(): CompletionItem[] {
  return Object.keys(TYPE_DOCS).map((t) => ({
    label: t,
    kind: CompletionItemKind.TypeParameter,
    detail: 'ESQL type',
    documentation: {
      kind: 'markdown',
      value: formatDoc(TYPE_DOCS[t]),
    },
  }));
}

export function buildBuiltinVarCompletions(): CompletionItem[] {
  return Object.keys(BUILTIN_VAR_DOCS).map((v) => ({
    label: v,
    kind: CompletionItemKind.Variable,
    detail: 'ESQL built-in variable',
    documentation: {
      kind: 'markdown',
      value: formatDoc(BUILTIN_VAR_DOCS[v]),
    },
  }));
}

export function buildBuiltinFuncCompletions(): CompletionItem[] {
  return Object.keys(BUILTIN_FUNC_DOCS).map((f) => ({
    label: f,
    kind: CompletionItemKind.Function,
    detail: 'ESQL built-in function',
    insertText: f,
    documentation: {
      kind: 'markdown',
      value: formatDoc(BUILTIN_FUNC_DOCS[f]),
    },
  }));
}

function formatDoc(doc: ESQLDoc): string {
  const lines: string[] = [];
  if (doc.signature) {
    lines.push('```esql', doc.signature, '```', '');
  }
  lines.push(doc.documentation);
  return lines.join('\n');
}

/** Look up hover documentation for a word (case-insensitive). */
export function lookupHoverDoc(word: string): string | null {
  const upper = word.toUpperCase();
  if (KEYWORD_DOCS[upper]) {
    return formatDoc(KEYWORD_DOCS[upper]);
  }
  if (TYPE_DOCS[upper]) {
    return `**Type** — ${formatDoc(TYPE_DOCS[upper])}`;
  }
  if (BUILTIN_FUNC_DOCS[upper]) {
    return `**Built-in function**\n\n${formatDoc(BUILTIN_FUNC_DOCS[upper])}`;
  }
  if (BUILTIN_VAR_DOCS[word]) {
    return `**Built-in variable**\n\n${formatDoc(BUILTIN_VAR_DOCS[word])}`;
  }
  return null;
}
