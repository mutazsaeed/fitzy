-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "branchId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "workingHours" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymAdminBranch" (
    "gymAdminId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymAdminBranch_pkey" PRIMARY KEY ("gymAdminId","branchId")
);

-- CreateIndex
CREATE INDEX "Branch_gymId_isActive_idx" ON "public"."Branch"("gymId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_branch_name_per_gym" ON "public"."Branch"("gymId", "name");

-- CreateIndex
CREATE INDEX "GymAdminBranch_branchId_idx" ON "public"."GymAdminBranch"("branchId");

-- CreateIndex
CREATE INDEX "Visit_branchId_visitDate_idx" ON "public"."Visit"("branchId", "visitDate");

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymAdminBranch" ADD CONSTRAINT "GymAdminBranch_gymAdminId_fkey" FOREIGN KEY ("gymAdminId") REFERENCES "public"."GymAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymAdminBranch" ADD CONSTRAINT "GymAdminBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
