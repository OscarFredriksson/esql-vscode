/**
 * Message Tree Schema
 *
 * Defines the structure of InputRoot and OutputRoot message trees in ACE,
 * including available field paths, types, and documentation.
 */

export interface FieldInfo {
  type: string; // e.g., "INTEGER", "VARCHAR", "STRUCTURE", "LIST"
  description: string;
  children?: Record<string, FieldInfo>;
}

export interface MessageSchema {
  [key: string]: FieldInfo;
}

/**
 * Common message trees available in ACE.
 * This covers InputRoot/OutputRoot for common transports and message formats.
 */
export const MESSAGE_TREE_SCHEMA: Record<string, MessageSchema> = {
  InputRoot: {
    MQ: {
      type: 'STRUCTURE',
      description: 'MQ Message Headers and Properties',
      children: {
        Mq_Header: {
          type: 'STRUCTURE',
          description: 'MQ Message Header (MQMD structure)',
        },
        Mq_MessageProperties: {
          type: 'STRUCTURE',
          description: 'MQ Message Properties (RFH2 extension)',
        },
      },
    },
    HTTP: {
      type: 'STRUCTURE',
      description: 'HTTP Request Headers and Properties',
      children: {
        HTTPInputHeader: {
          type: 'STRUCTURE',
          description: 'HTTP input headers',
        },
        HTTPRequestBody: {
          type: 'STRUCTURE',
          description: 'HTTP request body',
        },
      },
    },
    JMS: {
      type: 'STRUCTURE',
      description: 'JMS Message Headers and Properties',
      children: {
        JMSMessage: {
          type: 'STRUCTURE',
          description: 'JMS message structure',
        },
      },
    },
    XMLNSC: {
      type: 'STRUCTURE',
      description: 'XML Message',
      children: {
        '*': {
          type: 'ANY',
          description: 'XML element (dynamic)',
        },
      },
    },
    JSON_d: {
      type: 'STRUCTURE',
      description: 'JSON message (dynamic parsed structure)',
      children: {
        '*': {
          type: 'ANY',
          description: 'JSON field (dynamic)',
        },
      },
    },
    Environment: {
      type: 'STRUCTURE',
      description: 'Environment variables and shared state',
      children: {
        '*': {
          type: 'ANY',
          description: 'Environment variable (dynamic)',
        },
      },
    },
    LocalEnvironment: {
      type: 'STRUCTURE',
      description: 'Local (non-persistent) state',
      children: {
        '*': {
          type: 'ANY',
          description: 'Local variable (dynamic)',
        },
      },
    },
    ExceptionList: {
      type: 'STRUCTURE',
      description: 'Exception information',
      children: {
        '*': {
          type: 'STRUCTURE',
          description: 'Exception entry (dynamic)',
        },
      },
    },
  },
  OutputRoot: {
    MQ: {
      type: 'STRUCTURE',
      description: 'MQ Message Headers and Properties (output)',
      children: {
        Mq_Header: {
          type: 'STRUCTURE',
          description: 'MQ Message Header (MQMD structure)',
        },
        Mq_MessageProperties: {
          type: 'STRUCTURE',
          description: 'MQ Message Properties (RFH2 extension)',
        },
      },
    },
    HTTP: {
      type: 'STRUCTURE',
      description: 'HTTP Response Headers and Body',
      children: {
        HTTPResponseHeader: {
          type: 'STRUCTURE',
          description: 'HTTP response headers',
        },
        HTTPResponseBody: {
          type: 'STRUCTURE',
          description: 'HTTP response body',
        },
      },
    },
    JMS: {
      type: 'STRUCTURE',
      description: 'JMS Message (output)',
      children: {
        JMSMessage: {
          type: 'STRUCTURE',
          description: 'JMS message structure',
        },
      },
    },
    XMLNSC: {
      type: 'STRUCTURE',
      description: 'XML Message (output)',
      children: {
        '*': {
          type: 'ANY',
          description: 'XML element (dynamic)',
        },
      },
    },
    JSON_d: {
      type: 'STRUCTURE',
      description: 'JSON message (output, dynamic structure)',
      children: {
        '*': {
          type: 'ANY',
          description: 'JSON field (dynamic)',
        },
      },
    },
    Environment: {
      type: 'STRUCTURE',
      description: 'Environment variables (persistent state)',
      children: {
        '*': {
          type: 'ANY',
          description: 'Environment variable (dynamic)',
        },
      },
    },
    LocalEnvironment: {
      type: 'STRUCTURE',
      description: 'Local (non-persistent) state',
      children: {
        '*': {
          type: 'ANY',
          description: 'Local variable (dynamic)',
        },
      },
    },
    ExceptionList: {
      type: 'STRUCTURE',
      description: 'Exception information',
      children: {
        '*': {
          type: 'STRUCTURE',
          description: 'Exception entry (dynamic)',
        },
      },
    },
  },
};

/**
 * Get field information for a given path.
 * Example: "InputRoot.MQ.Mq_Header" -> FieldInfo for Mq_Header
 */
export function getFieldAtPath(path: string): FieldInfo | null {
  const parts = path.split('.');
  if (parts.length === 0) return null;

  const rootName = parts[0];
  const schema = MESSAGE_TREE_SCHEMA[rootName];
  if (!schema) return null;

  // Root path (e.g. "InputRoot") does not represent a concrete field node.
  if (parts.length === 1) {
    return null;
  }

  let current: FieldInfo | undefined = schema[parts[1]];
  for (let i = 2; i < parts.length && current; i++) {
    const part = parts[i];
    if (current.children) {
      current = current.children[part] || current.children['*'];
    } else {
      return null;
    }
  }

  return current || null;
}

/**
 * Get available completions for a path.
 * Example: "InputRoot.MQ." -> ["Mq_Header", "Mq_MessageProperties"]
 */
export function getCompletionsForPath(path: string): string[] {
  const parts = path.split('.');
  if (parts.length === 0) return [];

  // Root-level completion, e.g. "InputRoot." -> top-level parsers/trees.
  if (parts.length === 1) {
    const schema = MESSAGE_TREE_SCHEMA[parts[0]];
    if (!schema) return [];
    return Object.keys(schema).filter((key) => key !== '*');
  }

  const field = getFieldAtPath(path);
  if (!field || !field.children) return [];
  return Object.keys(field.children).filter(key => key !== '*');
}
