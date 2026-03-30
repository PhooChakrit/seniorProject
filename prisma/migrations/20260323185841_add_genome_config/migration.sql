-- CreateTable
CREATE TABLE "GenomeConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assemblyConfig" JSONB NOT NULL,
    "tracks" JSONB NOT NULL,
    "defaultSession" JSONB NOT NULL,
    "defaultLocation" TEXT NOT NULL,
    "assemblyName" TEXT NOT NULL,
    "cultivarType" TEXT NOT NULL,
    "tracksLoaded" TEXT NOT NULL,
    "defaultRegion" TEXT NOT NULL,
    "specialFeatures" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenomeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GenomeConfig_key_key" ON "GenomeConfig"("key");
