/**
 * Parser for IBM ACE Message Flow and Subflow XML files (XMI format)
 */

import { XMLParser } from 'fast-xml-parser';
import {
  FlowModel,
  FlowNode,
  FlowConnection,
  Terminal,
  BendPoint,
  FlowMetadata,
  NODE_TYPE_INFO,
} from '../models/flowModel';

export class FlowParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
      trimValues: true,
      parseTagValue: true,
      allowBooleanAttributes: true,
    });
  }

  /**
   * Parse a message flow or subflow XML file
   */
  public parse(xmlContent: string): FlowModel {
    const parsed = this.parser.parse(xmlContent);
    const root = parsed['ecore:EPackage'];

    if (!root) {
      throw new Error('Invalid flow file: missing ecore:EPackage root element');
    }

    const metadata = this.extractMetadata(root);
    const composition = root['eClassifiers']?.['composition'];

    if (!composition) {
      throw new Error('Invalid flow file: missing composition element');
    }

    const nodes = this.extractNodes(composition, root);
    const connections = this.extractConnections(composition, nodes);
    const stickyNotes = this.extractStickyNotes(root['eClassifiers']);

    return {
      metadata,
      nodes,
      connections,
      stickyNotes,
    };
  }

  private extractMetadata(root: any): FlowMetadata {
    return {
      name: root['@_nsPrefix'] || 'Unknown Flow',
      nsURI: root['@_nsURI'],
      nsPrefix: root['@_nsPrefix'],
      colorGraphic16: root['eClassifiers']?.['@_colorGraphic16'],
      colorGraphic32: root['eClassifiers']?.['@_colorGraphic32'],
      longDescription: root['eClassifiers']?.['longDescription'],
      description: root['eClassifiers']?.['shortDescription'],
    };
  }

  private extractNodes(composition: any, root: any): FlowNode[] {
    const nodes: FlowNode[] = [];
    const nodesData = composition['nodes'];

    if (!nodesData) {
      return nodes;
    }

    // Handle both array and single node
    const nodeArray = Array.isArray(nodesData) ? nodesData : [nodesData];

    for (const nodeData of nodeArray) {
      const node = this.parseNode(nodeData, root);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  private parseNode(nodeData: any, root: any): FlowNode | null {
    const id = nodeData['@_xmi:id'];
    if (!id) {
      return null;
    }

    const type = nodeData['@_xmi:type'] || 'Unknown';
    const location = this.parseLocation(nodeData['@_location']);

    // Extract label from translation or use type
    let label = this.extractLabel(nodeData, type);

    // Extract properties
    const properties: Record<string, any> = {};
    for (const key in nodeData) {
      if (
        key.startsWith('@_') &&
        key !== '@_xmi:id' &&
        key !== '@_xmi:type' &&
        key !== '@_location'
      ) {
        const propName = key.substring(2);
        properties[propName] = nodeData[key];
      }
    }

    // Extract terminals
    const terminals = this.extractTerminals(type);

    return {
      id,
      type,
      label,
      location,
      properties,
      terminals,
    };
  }

  private parseLocation(locationStr: string | undefined): {
    x: number;
    y: number;
  } {
    if (!locationStr) {
      return { x: 0, y: 0 };
    }

    const parts = locationStr.split(',');
    return {
      x: parseInt(parts[0] || '0', 10),
      y: parseInt(parts[1] || '0', 10),
    };
  }

  private extractLabel(nodeData: any, type: string): string {
    // For Label nodes, use labelName attribute
    if (type.includes('ComIbmLabel') && nodeData['@_labelName']) {
      return nodeData['@_labelName'];
    }

    // For Compute nodes, use translation string
    if (
      type.includes('ComIbmCompute') &&
      nodeData['translation']?.['@_string']
    ) {
      return nodeData['translation']['@_string'];
    }

    // Try to get label from translation
    if (nodeData['translation']?.['@_label']) {
      return nodeData['translation']['@_label'];
    }

    // Try to get from translation string as fallback
    if (nodeData['translation']?.['@_string']) {
      return nodeData['translation']['@_string'];
    }

    // Try to get from properties
    if (nodeData['@_label']) {
      return nodeData['@_label'];
    }

    // Get from type info
    const typeInfo = NODE_TYPE_INFO[type];
    if (typeInfo) {
      return typeInfo.label;
    }

    // Extract from type string
    if (type.includes('.msgnode')) {
      const match = type.match(/ComIbm(.+?)\.msgnode/);
      if (match) {
        return match[1];
      }
    }

    if (type.includes('FCMSource')) {
      return 'Input';
    }

    if (type.includes('FCMSink')) {
      return 'Output';
    }

    return type;
  }

  private extractTerminals(type: string): Terminal[] {
    const terminals: Terminal[] = [];

    // Default terminals based on node type
    if (type.includes('FCMSource')) {
      terminals.push({
        name: 'OutTerminal.out',
        direction: 'output',
        label: 'out',
      });
    } else if (type.includes('FCMSink')) {
      terminals.push({
        name: 'InTerminal.in',
        direction: 'input',
        label: 'in',
      });
    } else if (type.includes('ComIbmTryCatch')) {
      terminals.push({
        name: 'InTerminal.in',
        direction: 'input',
        label: 'in',
      });
      terminals.push({
        name: 'OutTerminal.try',
        direction: 'output',
        label: 'try',
      });
      terminals.push({
        name: 'OutTerminal.catch',
        direction: 'output',
        label: 'catch',
      });
    } else if (type.includes('ComIbmFilter')) {
      terminals.push({
        name: 'InTerminal.in',
        direction: 'input',
        label: 'in',
      });
      terminals.push({
        name: 'OutTerminal.true',
        direction: 'output',
        label: 'true',
      });
      terminals.push({
        name: 'OutTerminal.false',
        direction: 'output',
        label: 'false',
      });
      terminals.push({
        name: 'OutTerminal.unknown',
        direction: 'output',
        label: 'unknown',
      });
    } else {
      // Default: one input, one output
      terminals.push({
        name: 'InTerminal.in',
        direction: 'input',
        label: 'in',
      });
      terminals.push({
        name: 'OutTerminal.out',
        direction: 'output',
        label: 'out',
      });
    }

    return terminals;
  }

  private extractConnections(
    composition: any,
    nodes: FlowNode[],
  ): FlowConnection[] {
    const connections: FlowConnection[] = [];
    const connectionsData = composition['connections'];

    if (!connectionsData) {
      return connections;
    }

    // Handle both array and single connection
    const connectionArray = Array.isArray(connectionsData)
      ? connectionsData
      : [connectionsData];

    for (const connData of connectionArray) {
      const connection = this.parseConnection(connData);
      if (connection) {
        connections.push(connection);
      }
    }

    return connections;
  }

  private parseConnection(connData: any): FlowConnection | null {
    const id = connData['@_xmi:id'];
    const sourceNodeId = connData['@_sourceNode'];
    const targetNodeId = connData['@_targetNode'];
    const sourceTerminal =
      connData['@_sourceTerminalName'] || 'OutTerminal.out';
    const targetTerminal = connData['@_targetTerminalName'] || 'InTerminal.in';

    if (!id || !sourceNodeId || !targetNodeId) {
      return null;
    }

    const bendPoints = this.parseBendPoints(connData['bendPoints']);

    return {
      id,
      sourceNodeId,
      targetNodeId,
      sourceTerminal,
      targetTerminal,
      bendPoints,
    };
  }

  private parseBendPoints(bendPointsStr: string | undefined): BendPoint[] {
    if (!bendPointsStr) {
      return [];
    }

    const points: BendPoint[] = [];
    const coords = bendPointsStr.split(',');

    for (let i = 0; i < coords.length; i += 2) {
      if (i + 1 < coords.length) {
        points.push({
          x: parseInt(coords[i], 10),
          y: parseInt(coords[i + 1], 10),
        });
      }
    }

    return points;
  }

  private extractStickyNotes(eClassifiers: any): any[] {
    const stickyNotes: any[] = [];
    const stickyBoard = eClassifiers?.['stickyBoard'];

    if (!stickyBoard || !stickyBoard['stickyNote']) {
      return stickyNotes;
    }

    const notesData = Array.isArray(stickyBoard['stickyNote'])
      ? stickyBoard['stickyNote']
      : [stickyBoard['stickyNote']];

    for (const noteData of notesData) {
      const location = this.parseLocation(noteData['@_location']);
      const body = noteData['body']?.['@_string'] || '';

      if (body) {
        stickyNotes.push({
          location,
          body,
        });
      }
    }

    console.log('Parsed sticky notes:', stickyNotes.length);
    return stickyNotes;
  }
}
