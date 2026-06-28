"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";

import Button from "@/components/ui/Button";
import FilterField, { filterInputClassName } from "@/components/ui/FilterField";
import type { StationMapFilters } from "@/features/charging/station-map";
import Card from "@/components/ui/Card";

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
  const t = useTranslations("map");
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
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <Card className="mb-6">
      <form onSubmit={updateFilters} className="grid gap-4 md:grid-cols-4">
        <FilterField label={t("provinceLabel")}>
          <select
            name="province"
            defaultValue={filters.province ?? ""}
            className={filterInputClassName}
          >
            <option value="">{t("allProvinces")}</option>
            {provinceOptions.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t("connectorLabel")}>
          <select
            name="connector"
            defaultValue={filters.connector ?? ""}
            className={filterInputClassName}
          >
            <option value="">{t("anyConnector")}</option>
            {connectorOptions.map((connectorType) => (
              <option key={connectorType} value={connectorType}>
                {connectorType}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label={t("minPowerLabel")}>
          <select
            name="minPowerKw"
            defaultValue={filters.minPowerKw?.toString() ?? ""}
            className={filterInputClassName}
          >
            <option value="">{t("anyPower")}</option>
            {POWER_OPTIONS.map((power) => (
              <option key={power} value={power}>
                {power} kW+
              </option>
            ))}
          </select>
        </FilterField>

        <div className="flex items-end gap-3">
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? t("updatingButton") : t("updateButton")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={clearFilters}
            disabled={isPending}
          >
            {t("clearButton")}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default StationMapFiltersClient;
