-- CreateEnum
CREATE TYPE "HousekeepingStatus" AS ENUM ('CLEAN', 'NOT_CLEAN', 'IN_PROGRESS', 'REPAIR');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "housekeeping" "HousekeepingStatus" NOT NULL DEFAULT 'CLEAN';
