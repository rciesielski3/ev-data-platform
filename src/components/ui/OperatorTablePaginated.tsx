"use client";

import { useSearchParams } from "next/navigation";

import Card from "@/components/ui/Card";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";
import { formatInteger, formatConnectorPower } from "@/features/charging/insights";

type OperatorTableHeaders = {
  operator: string;
  stations: string;
  provinces: string;
  connectors: string;
  knownPower: string;
  avgPower: string;
  maxPower: string;
  strongestStation: string;
};

type OperatorTablePaginatedProps = {
  rows: OperatorIntelligenceRow[];
  title: string;
  subtitle: string;
  headers: OperatorTableHeaders;
  unknownLabel: string;
  localizeOperatorLabel: (value: string) => string;
};

const OperatorTable = ({
  rows,
  headers,
  unknownLabel,
  localizeOperatorLabel,
}: {
  rows: OperatorIntelligenceRow[];
  headers: OperatorTableHeaders;
  unknownLabel: string;
  localizeOperatorLabel: (value: string) => string;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th scope="col" className="py-3 pr-4">
            {headers.operator}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.stations}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.provinces}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.connectors}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.knownPower}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.avgPower}
          </th>
          <th scope="col" className="px-4 py-3 text-right">
            {headers.maxPower}
          </th>
          <th scope="col" className="py-3 pl-4">
            {headers.strongestStation}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.operatorName}>
            <th scope="row" className="py-4 pr-4 text-left font-medium text-slate-950">
              {localizeOperatorLabel(row.operatorName)}
            </th>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.stationCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.provinceCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.connectorCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatInteger(row.knownPowerConnectorCount)}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {row.averagePowerKw ? formatConnectorPower(row.averagePowerKw) : unknownLabel}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {row.maxPowerKw ? formatConnectorPower(row.maxPowerKw) : unknownLabel}
            </td>
            <td className="py-4 pl-4 text-slate-700">
              {row.strongestStationName
                ? localizeOperatorLabel(row.strongestStationName)
                : unknownLabel}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const OperatorTablePaginated = ({
  rows,
  title,
  subtitle,
  headers,
  unknownLabel,
  localizeOperatorLabel,
}: OperatorTablePaginatedProps) => {
  const searchParams = useSearchParams();
  const ROWS_PER_PAGE = 10;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedRows = rows.slice(startIndex, endIndex);

  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNum.toString());
    return `?${params.toString()}`;
  };

  const getPaginationButtons = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const buttons = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) buttons.push(-1);
    for (let i = start; i <= end; i++) buttons.push(i);
    if (end < totalPages - 1) buttons.push(-1);
    buttons.push(totalPages);

    return buttons;
  };

  return (
    <Card as="section">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="muted mt-1 text-sm">{subtitle}</p>
      </div>
      <OperatorTable
        rows={paginatedRows}
        headers={headers}
        unknownLabel={unknownLabel}
        localizeOperatorLabel={localizeOperatorLabel}
      />
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1}–{Math.min(endIndex, rows.length)} of {rows.length}
          </div>
          <div className="flex gap-2">
            <a
              href={createPageUrl(currentPage - 1)}
              className={`rounded-md border border-slate-300 px-3 py-2 text-sm font-medium ${
                currentPage === 1
                  ? "pointer-events-none bg-slate-50 text-slate-400 opacity-50"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Previous
            </a>
            <div className="flex items-center gap-1">
              {getPaginationButtons().map((page) =>
                page === -1 ? (
                  <span key={`ellipsis-${Math.random()}`} className="px-2 py-2 text-slate-500">
                    …
                  </span>
                ) : (
                  <a
                    key={page}
                    href={createPageUrl(page)}
                    className={`rounded-md px-2 py-2 text-sm font-medium border border-slate-300 ${
                      currentPage === page
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </a>
                )
              )}
            </div>
            <a
              href={createPageUrl(currentPage + 1)}
              className={`rounded-md border border-slate-300 px-3 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? "pointer-events-none bg-slate-50 text-slate-400 opacity-50"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};
