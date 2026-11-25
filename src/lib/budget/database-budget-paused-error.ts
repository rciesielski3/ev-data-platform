export class DatabaseBudgetPausedError extends Error {
  constructor(message = "Database access paused by the Neon budget guard") {
    super(message);
    this.name = "DatabaseBudgetPausedError";
  }
}
