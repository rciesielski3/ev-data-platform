import { get } from "@vercel/global-config";

import { DatabaseBudgetPausedError } from "./database-budget-paused-error";

export type BudgetLevel = "normal" | "saving" | "frozen";
export type BudgetScope = "detail" | "all";

export const SAVING_THRESHOLD = 0.85;
export const FROZEN_THRESHOLD = 0.95;

const BUDGET_KEY = "neon-budget";
const CACHE_TTL_MS = 60_000;
const READ_TIMEOUT_MS = 1_500;

export const levelFromUsage = (cuHours: number, limit: number): BudgetLevel => {
  if (!Number.isFinite(cuHours) || !Number.isFinite(limit) || limit <= 0) return "normal";
  const ratio = cuHours / limit;
  if (ratio >= FROZEN_THRESHOLD) return "frozen";
  if (ratio >= SAVING_THRESHOLD) return "saving";
  return "normal";
};

export const parseBudgetLevel = (value: unknown, now: number = Date.now()): BudgetLevel => {
  if (typeof value !== "object" || value === null) return "normal";
  const { level, periodEnd } = value as { level?: unknown; periodEnd?: unknown };
  if (typeof periodEnd === "string") {
    const end = Date.parse(periodEnd);
    if (Number.isFinite(end) && end <= now) return "normal";
  }
  return level === "saving" || level === "frozen" ? level : "normal";
};

const readLevel = async (): Promise<BudgetLevel> => {
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) return "normal";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<undefined>((resolve) => {
      timer = setTimeout(() => resolve(undefined), READ_TIMEOUT_MS);
    });
    return parseBudgetLevel(await Promise.race([get(BUDGET_KEY), timeout]));
  } catch {
    return "normal";
  } finally {
    clearTimeout(timer);
  }
};

let cached: { level: Promise<BudgetLevel>; expiresAt: number } | null = null;

export const resetBudgetLevelCache = () => {
  cached = null;
};

export const getBudgetLevel = (): Promise<BudgetLevel> => {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.level;
  const level = readLevel();
  cached = { level, expiresAt: now + CACHE_TTL_MS };
  return level;
};

export const isScopePaused = (level: BudgetLevel, scope: BudgetScope): boolean =>
  level === "frozen" || (level === "saving" && scope === "detail");

export const throwIfBudgetPaused = async (scope: BudgetScope): Promise<void> => {
  if (isScopePaused(await getBudgetLevel(), scope)) throw new DatabaseBudgetPausedError();
};
