-- AlterTable
ALTER TABLE "producciones" ADD COLUMN "cierreId" TEXT;

-- CreateTable
CREATE TABLE "cierres_bodega" (
    "id" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anterior" JSONB NOT NULL,

    CONSTRAINT "cierres_bodega_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "producciones" ADD CONSTRAINT "producciones_cierreId_fkey" FOREIGN KEY ("cierreId") REFERENCES "cierres_bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;
