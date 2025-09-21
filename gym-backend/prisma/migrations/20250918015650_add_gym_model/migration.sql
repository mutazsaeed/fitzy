-- CreateTable
CREATE TABLE "public"."Gym" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "images" TEXT[],
    "gender" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "workingHours" JSONB,
    "services" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_GymToSubscription" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GymToSubscription_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GymToSubscription_B_index" ON "public"."_GymToSubscription"("B");

-- AddForeignKey
ALTER TABLE "public"."_GymToSubscription" ADD CONSTRAINT "_GymToSubscription_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GymToSubscription" ADD CONSTRAINT "_GymToSubscription_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
