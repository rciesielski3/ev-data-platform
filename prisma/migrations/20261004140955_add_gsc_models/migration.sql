-- CreateTable
CREATE TABLE "GscKeyword" (
    "id" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "currentPosition" DOUBLE PRECISION NOT NULL,
    "currentClicks" INTEGER NOT NULL DEFAULT 0,
    "currentImpressions" INTEGER NOT NULL DEFAULT 0,
    "currentCtr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GscKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GscSnapshot" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GscSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GscKeyword_siteUrl_query_key" ON "GscKeyword"("siteUrl", "query");

-- CreateIndex
CREATE INDEX "GscKeyword_siteUrl_lastUpdated_idx" ON "GscKeyword"("siteUrl", "lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "GscSnapshot_keywordId_date_key" ON "GscSnapshot"("keywordId", "date");

-- CreateIndex
CREATE INDEX "GscSnapshot_date_idx" ON "GscSnapshot"("date");

-- AddForeignKey
ALTER TABLE "GscSnapshot" ADD CONSTRAINT "GscSnapshot_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "GscKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
