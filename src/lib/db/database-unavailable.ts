const UNAVAILABLE_ERROR_NAMES = ["PrismaClientInitializationError"];
const UNAVAILABLE_ERROR_CODES = ["P1001", "P1017"];

export const isDatabaseUnavailableError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  if (typeof name === "string" && UNAVAILABLE_ERROR_NAMES.includes(name)) return true;
  if (typeof code === "string" && UNAVAILABLE_ERROR_CODES.includes(code)) return true;
  return name === "PrismaClientKnownRequestError" && code === "P2024";
};
