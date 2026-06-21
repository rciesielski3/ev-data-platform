"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";

import type { StationMapFilters } from "@/features/charging/station-map";

type StationMapFiltersClientProps = {
  filters: StationMapFilters;
  provinceOptions: string[];
  connectorOptions: string[];
};

const POWER_OPTIONS = [22, 50, 100, 150, 250];

const StationMapFiltersClient = ({
  filters,
  provinceOptions,
  connectorOptions,
}: StationMapFiltersClientProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ["province", "connector", "minPowerKw"]) {
      const value = formData.get(key)?.toString().trim();

      if (value) {
        params.set(key, value);
      }
    }

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <form onSubmit={updateFilters} className="card mb-6 grid gap-4 md:grid-cols-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Province</span>
        <select
          name="province"
          defaultValue={filters.province ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">All provinces</option>
          {provinceOptions.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Connector</span>
        <select
          name="connector"
          defaultValue={filters.connector ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">Any connector</option>
          {connectorOptions.map((connectorType) => (
            <option key={connectorType} value={connectorType}>
              {connectorType}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Minimum power</span>
        <select
          name="minPowerKw"
          defaultValue={filters.minPowerKw?.toString() ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">Any power</option>
          {POWER_OPTIONS.map((power) => (
            <option key={power} value={power}>
              {power} kW+
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Updating..." : "Update map"}
        </button>
        <button
          type="button"
          onClick={clearFilters}
          disabled={isPending}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default StationMapFiltersClient;
