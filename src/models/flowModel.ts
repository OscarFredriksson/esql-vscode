/**
 * Data model for IBM ACE Message Flows and Subflows
 */

export interface FlowModel {
  nodes: FlowNode[];
  connections: FlowConnection[];
  metadata: FlowMetadata;
  stickyNotes: StickyNote[];
}

export interface FlowMetadata {
  name: string;
  description?: string;
  nsURI?: string;
  nsPrefix?: string;
  colorGraphic16?: string;
  colorGraphic32?: string;
  longDescription?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  label: string;
  location: { x: number; y: number };
  properties: Record<string, any>;
  terminals: Terminal[];
  width?: number;
  height?: number;
}

export interface Terminal {
  name: string;
  direction: 'input' | 'output';
  label?: string;
}

export interface FlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceTerminal: string;
  targetTerminal: string;
  bendPoints: BendPoint[];
}

export interface BendPoint {
  x: number;
  y: number;
}

export interface StickyNote {
  location: { x: number; y: number };
  body: string;
}

export enum NodeType {
  // Flow Terminals
  FCMSource = 'eflow:FCMSource',
  FCMSink = 'eflow:FCMSink',

  // IBM Built-in Nodes
  ComIbmCompute = 'ComIbmCompute.msgnode',
  ComIbmJavaCompute = 'ComIbmJavaCompute.msgnode',
  ComIbmMQInput = 'ComIbmMQInput.msgnode',
  ComIbmMQOutput = 'ComIbmMQOutput.msgnode',
  ComIbmMQGet = 'ComIbmMQGet.msgnode',
  ComIbmWSInput = 'ComIbmWSInput.msgnode',
  ComIbmWSReply = 'ComIbmWSReply.msgnode',
  ComIbmWSRequest = 'ComIbmWSRequest.msgnode',
  ComIbmHTTPRequest = 'ComIbmHTTPRequest.msgnode',
  ComIbmHTTPReply = 'ComIbmHTTPReply.msgnode',
  ComIbmResetContentDescriptor = 'ComIbmResetContentDescriptor.msgnode',
  ComIbmLabel = 'ComIbmLabel.msgnode',
  ComIbmFilter = 'ComIbmFilter.msgnode',
  ComIbmTryCatch = 'ComIbmTryCatch.msgnode',
  ComIbmScheduler = 'ComIbmScheduler.msgnode',
  ComIbmThrow = 'ComIbmThrow.msgnode',
  ComIbmTrace = 'ComIbmTrace.msgnode',
  ComIbmSOAPInput = 'ComIbmSOAPInput.msgnode',
  ComIbmSOAPReply = 'ComIbmSOAPReply.msgnode',
  ComIbmSOAPRequest = 'ComIbmSOAPRequest.msgnode',

  // Generic/Unknown
  Unknown = 'Unknown',
}

export interface NodeTypeInfo {
  color: string;
  label: string;
  category:
    | 'input'
    | 'output'
    | 'compute'
    | 'routing'
    | 'mq'
    | 'http'
    | 'terminal'
    | 'error'
    | 'other';
}

export const NODE_TYPE_INFO: Record<string, NodeTypeInfo> = {
  [NodeType.FCMSource]: {
    color: '#4CAF50',
    label: 'Input',
    category: 'terminal',
  },
  [NodeType.FCMSink]: {
    color: '#F44336',
    label: 'Output',
    category: 'terminal',
  },
  [NodeType.ComIbmCompute]: {
    color: '#2196F3',
    label: 'Compute',
    category: 'compute',
  },
  [NodeType.ComIbmJavaCompute]: {
    color: '#3F51B5',
    label: 'JavaCompute',
    category: 'compute',
  },
  [NodeType.ComIbmMQInput]: {
    color: '#FFFFFF',
    label: 'MQ Input',
    category: 'input',
  },
  [NodeType.ComIbmMQOutput]: {
    color: '#FF9800',
    label: 'MQ Output',
    category: 'mq',
  },
  [NodeType.ComIbmMQGet]: { color: '#FF9800', label: 'MQ Get', category: 'mq' },
  [NodeType.ComIbmWSInput]: {
    color: '#FFFFFF',
    label: 'WS Input',
    category: 'input',
  },
  [NodeType.ComIbmWSReply]: {
    color: '#9C27B0',
    label: 'WS Reply',
    category: 'http',
  },
  [NodeType.ComIbmWSRequest]: {
    color: '#9C27B0',
    label: 'WS Request',
    category: 'http',
  },
  [NodeType.ComIbmHTTPRequest]: {
    color: '#9C27B0',
    label: 'HTTP Request',
    category: 'http',
  },
  [NodeType.ComIbmHTTPReply]: {
    color: '#9C27B0',
    label: 'HTTP Reply',
    category: 'http',
  },
  [NodeType.ComIbmResetContentDescriptor]: {
    color: '#00BCD4',
    label: 'Reset Content Descriptor',
    category: 'other',
  },
  [NodeType.ComIbmLabel]: {
    color: '#FF9800',
    label: 'Label',
    category: 'routing',
  },
  [NodeType.ComIbmFilter]: {
    color: '#8BC34A',
    label: 'Filter',
    category: 'routing',
  },
  [NodeType.ComIbmTryCatch]: {
    color: '#E91E63',
    label: 'Try Catch',
    category: 'error',
  },
  [NodeType.ComIbmThrow]: {
    color: '#E91E63',
    label: 'Throw',
    category: 'error',
  },
  [NodeType.ComIbmTrace]: {
    color: '#795548',
    label: 'Trace',
    category: 'other',
  },
  [NodeType.ComIbmScheduler]: {
    color: '#FFC107',
    label: 'Scheduler',
    category: 'input',
  },
  [NodeType.ComIbmSOAPInput]: {
    color: '#673AB7',
    label: 'SOAP Input',
    category: 'input',
  },
  [NodeType.ComIbmSOAPReply]: {
    color: '#673AB7',
    label: 'SOAP Reply',
    category: 'output',
  },
  [NodeType.ComIbmSOAPRequest]: {
    color: '#673AB7',
    label: 'SOAP Request',
    category: 'http',
  },
};
