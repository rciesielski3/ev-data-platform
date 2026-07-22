"use client";

import { useState } from "react";

import Card from "@/components/ui/Card";
import { type OperatorIntelligenceRow } from "@/features/charging/operator-intelligence";

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

const numberFormatter = new Intl.NumberFormat("en");

const formatInteger = (value: number) => numberFormatter.format(value);

const formatPower = (value: number | null) => {
  if (value === null) {
    return null;
  }

  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} kW`;
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
              {formatPower(row.averagePowerKw) ?? unknownLabel}
            </td>
            <td className="px-4 py-4 text-right text-slate-700">
              {formatPower(row.maxPowerKw) ?? unknownLabel}
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
  const ROWS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedRows = rows.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
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
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-2 py-2 text-sm font-medium ${
                    currentPage === page
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  } border border-slate-300`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
