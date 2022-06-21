import { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

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

export interface LinkInfo extends SimulationLinkDatum<NodeInfo> {
  matchLevel: string;
  matchKey: string;
  isCoreLink: boolean;
  id: number;
}

export interface Graph {
  nodes: NodeInfo[];
  links: LinkInfo[];
}
