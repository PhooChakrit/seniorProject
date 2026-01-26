-- CreateTable
CREATE TABLE "Spacer" (
    "id" SERIAL NOT NULL,
    "species" TEXT NOT NULL,
    "chromosome" TEXT NOT NULL,
    "startPos" INTEGER NOT NULL,
    "endPos" INTEGER NOT NULL,
    "strand" TEXT NOT NULL,
    "spacerSeq" TEXT NOT NULL,
    "pam" TEXT NOT NULL,
    "location" TEXT,
    "minMM_GG" TEXT,
    "minMM_AG" TEXT,
    "spacerClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spacer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Spacer_species_chromosome_startPos_idx" ON "Spacer"("species", "chromosome", "startPos");

-- CreateIndex
CREATE INDEX "Spacer_species_chromosome_endPos_idx" ON "Spacer"("species", "chromosome", "endPos");
