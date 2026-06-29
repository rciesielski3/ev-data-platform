-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "totalStationCount" INTEGER NOT NULL,
    "totalConnectorCount" INTEGER NOT NULL,
    "totalHpcStationCount" INTEGER NOT NULL,
    "knownPowerConnectorCount" INTEGER NOT NULL,
    "provinceMetrics" JSONB NOT NULL,
    "operatorStats" JSONB NOT NULL,
    "latestImportStatus" "IngestionStatus",
    "lastSuccessfulImportRunId" TEXT,
    "error" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_snapshotDate_key" ON "DailySnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "DailySnapshot_snapshotDate_idx" ON "DailySnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "DailySnapshot_capturedAt_idx" ON "DailySnapshot"("capturedAt");
