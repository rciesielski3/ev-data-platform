import {
  CONNECTOR_KNOWLEDGE_LIST,
  getConnectorKnowledge,
  type ConnectorKey,
  type ConnectorKnowledge,
} from "@/features/charging/connectors";

export type ConnectorPageEntry = ConnectorKnowledge & {
  href: string;
};

export const getConnectorPageHref = (key: ConnectorKey) => `/connectors/${key}`;

export const getConnectorPageEntries = (): ConnectorPageEntry[] =>
  CONNECTOR_KNOWLEDGE_LIST.map((connector) => ({
    ...connector,
    href: getConnectorPageHref(connector.key),
  }));

export const getConnectorPageKnowledge = (
  type: string | null | undefined,
): ConnectorKnowledge => getConnectorKnowledge(type);
