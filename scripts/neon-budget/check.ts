import { LIMIT_CU_HOURS, levelFromUsage } from "./level";

const NEON_API = "https://console.neon.tech/api/v2";
const VERCEL_API = "https://api.vercel.com/v1/global-config";
const ITEM_KEY = "neon-budget";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
};

const readJson = async (response: Response, what: string): Promise<unknown> => {
  if (!response.ok) {
    throw new Error(`${what} failed with HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

type Consumption = { cuHours: number; periodStart: string | null; periodEnd: string | null };

const fetchConsumption = async (): Promise<Consumption> => {
  const projectId = requireEnv("NEON_PROJECT_ID");
  const orgId = process.env.NEON_ORG_ID;
  const query = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
  const response = await fetch(`${NEON_API}/projects/${encodeURIComponent(projectId)}${query}`, {
    headers: { Authorization: `Bearer ${requireEnv("NEON_API_KEY")}`, Accept: "application/json" },
  });
  const body = (await readJson(response, "Neon project request")) as {
    project?: {
      compute_time_seconds?: unknown;
      consumption_period_start?: unknown;
      consumption_period_end?: unknown;
    };
  };
  const project = body.project;
  const seconds = project?.compute_time_seconds;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    throw new Error("Neon response has no usable project.compute_time_seconds");
  }
  const asString = (value: unknown) => (typeof value === "string" ? value : null);
  return {
    cuHours: seconds / 3600,
    periodStart: asString(project?.consumption_period_start),
    periodEnd: asString(project?.consumption_period_end),
  };
};

const writeLevel = async (value: Record<string, unknown>): Promise<void> => {
  const response = await fetch(`${VERCEL_API}/${encodeURIComponent(requireEnv("GLOBAL_CONFIG_ID"))}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${requireEnv("VERCEL_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items: [{ operation: "upsert", key: ITEM_KEY, value }] }),
  });
  await readJson(response, "Vercel Global Config update");
};

const main = async (): Promise<void> => {
  const dryRun = process.env.DRY_RUN === "1";
  const consumption = await fetchConsumption();
  const cuHours = Math.round(consumption.cuHours * 100) / 100;
  const payload = {
    level: levelFromUsage(consumption.cuHours, LIMIT_CU_HOURS),
    cuHours,
    limit: LIMIT_CU_HOURS,
    checkedAt: new Date().toISOString(),
  };

  console.log(`Consumption period: ${consumption.periodStart ?? "unknown"} -> ${consumption.periodEnd ?? "unknown"}`);
  console.log(`Level: ${payload.level} (${cuHours} of ${LIMIT_CU_HOURS} CU-h)`);
  console.log(`Payload: ${JSON.stringify({ key: ITEM_KEY, value: payload })}`);

  if (dryRun) {
    console.log("DRY_RUN=1: nothing written.");
    return;
  }
  await writeLevel(payload);
  console.log("Global Config updated.");
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`neon-budget check failed, previous Global Config value left untouched: ${message}`);
  process.exit(1);
});
