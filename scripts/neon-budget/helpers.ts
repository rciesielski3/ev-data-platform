export const parseStoreId = (raw: string): string => {
  const match = /ecfg_[A-Za-z0-9]+/.exec(raw);
  if (!match) throw new Error("GLOBAL_CONFIG_ID must contain the store id (ecfg_...)");
  return match[0];
};

export const isPeriodOver = (periodEnd: string | null, now: Date): boolean => {
  if (!periodEnd) return false;
  const end = Date.parse(periodEnd);
  return Number.isFinite(end) && end <= now.getTime();
};
