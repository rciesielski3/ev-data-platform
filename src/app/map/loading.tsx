import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/ui/PageHeader";

const MapLoading = async () => {
  const t = await getTranslations("map");

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />
      <div className="card mb-6 grid gap-4 !rounded-[2rem] !p-5 sm:!p-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl bg-forest/10"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[32rem] animate-pulse rounded-[2rem] bg-forest/10 lg:h-[42rem]" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-[1.5rem] bg-forest/10"
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default MapLoading;
