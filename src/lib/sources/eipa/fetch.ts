// Public EIPA export key used by the official map reader (see powerHub vite proxy).
const DEFAULT_EIPA_EXPORT_KEY = "cc00241029ceddb4013bf2e166193882";

const EIPA_EXPORT_BASE_URL = "https://eipa.udt.gov.pl/reader/export-data";

export const getEipaExportKey = () =>
  process.env.EIPA_EXPORT_KEY ?? DEFAULT_EIPA_EXPORT_KEY;

const fetchEipaExport = async <T>(resource: string): Promise<T> => {
  const exportKey = getEipaExportKey();
  const url = `${EIPA_EXPORT_BASE_URL}/${resource}/${exportKey}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`EIPA export failed (${resource}): HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const fetchEipaPools = async () =>
  fetchEipaExport<{ data: import("./types").EipaPool[]; generated: string }>(
    "pool",
  );

export const fetchEipaStations = async () =>
  fetchEipaExport<{ data: import("./types").EipaStation[]; generated: string }>(
    "station",
  );

export const fetchEipaPoints = async () =>
  fetchEipaExport<{ data: import("./types").EipaPoint[]; generated: string }>(
    "point",
  );

export const fetchEipaDynamic = async () =>
  fetchEipaExport<{
    data: import("./types").EipaDynamicPoint[];
    generated: string;
  }>("dynamic");

export const fetchEipaOperators = async () =>
  fetchEipaExport<{
    data: import("./types").EipaOperator[];
    generated: string;
  }>("operator");
