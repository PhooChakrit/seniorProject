-- AlterTable
ALTER TABLE "SearchJob" ADD COLUMN     "notifyEmail" TEXT;

-- AlterTable
ALTER TABLE "Spacer" ADD COLUMN     "geneId" TEXT;

-- CreateTable
CREATE TABLE "Gene" (
    "id" SERIAL NOT NULL,
    "species" TEXT NOT NULL,
    "geneId" TEXT NOT NULL,
    "symbol" TEXT,
    "chromosome" TEXT NOT NULL,
    "startPos" INTEGER NOT NULL,
    "endPos" INTEGER NOT NULL,
    "strand" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gene_species_symbol_idx" ON "Gene"("species", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Gene_species_geneId_key" ON "Gene"("species", "geneId");
