-- CreateEnum
CREATE TYPE "LiquorCategory" AS ENUM ('BEER', 'WINE', 'SPIRITS', 'LIQUEUR', 'READY_TO_DRINK', 'NON_ALCOHOLIC');

-- AlterTable
ALTER TABLE "LiquorProduct" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "category",
ADD COLUMN     "category" "LiquorCategory" NOT NULL;

