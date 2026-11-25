export type BudgetLevel = "normal" | "saving" | "frozen";

export const LIMIT_CU_HOURS = 100;

export const levelFromUsage = (cuHours: number, limit: number = LIMIT_CU_HOURS): BudgetLevel => {
  const ratio = cuHours / limit;
  if (ratio >= 0.95) return "frozen";
  if (ratio >= 0.85) return "saving";
  return "normal";
};
