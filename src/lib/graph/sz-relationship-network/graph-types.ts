import { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

/**
 * @internal
 */
export interface NodeInfo extends SimulationNodeDatum {
  index: number;
  entityId: string;
  isQueriedNode: boolean;
  isCoreNode: boolean;
  iconType: string;
  orgName: string;
  name: string;
  address: string;
  phone: string;
}
/**
 * @internal
 */
export interface LinkInfo extends SimulationLinkDatum<NodeInfo> {
  matchLevel: string;
  matchKey: string;
  isCoreLink: boolean;
  id: number;
}
/**
 * @internal
 */
export interface Graph {
  nodes: NodeInfo[];
  links: LinkInfo[];
}
