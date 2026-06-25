-- CreateEnum
CREATE TYPE "CallbackSource" AS ENUM ('psp', 'gsp');

-- CreateTable
CREATE TABLE "raw_events" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "source" "CallbackSource" NOT NULL,
    "provider" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_events_brandId_idx" ON "raw_events"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "raw_events_brandId_source_provider_idempotencyKey_key" ON "raw_events"("brandId", "source", "provider", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "raw_events" ADD CONSTRAINT "raw_events_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "tenants"("brandId") ON DELETE RESTRICT ON UPDATE CASCADE;
