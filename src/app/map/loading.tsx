import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/ui/PageHeader";

const MapLoading = async () => {
  const t = await getTranslations("map");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />
      <div className="card mb-6 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-md bg-slate-200"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[32rem] animate-pulse rounded-lg border border-slate-200 bg-white lg:h-[42rem]" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default MapLoading;
