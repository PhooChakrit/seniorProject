-- CreateTable
CREATE TABLE "SearchJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "species" TEXT NOT NULL,
    "chromosome" TEXT,
    "fromPosition" INTEGER,
    "toPosition" INTEGER,
    "geneId" TEXT,
    "result" TEXT,
    "error" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchJob_jobId_key" ON "SearchJob"("jobId");

-- AddForeignKey
ALTER TABLE "SearchJob" ADD CONSTRAINT "SearchJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
