-- CreateTable
CREATE TABLE "insumos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'g',
    "costoPorKg" DOUBLE PRECISION,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receta_items" (
    "productoId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "gramosPorTanda" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "receta_items_pkey" PRIMARY KEY ("productoId","insumoId")
);

-- CreateTable
CREATE TABLE "bodega_insumos" (
    "insumoId" TEXT NOT NULL,
    "ingresos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bodega" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bodega_insumos_pkey" PRIMARY KEY ("insumoId")
);

-- CreateTable
CREATE TABLE "producciones" (
    "id" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "algunCostoConocido" BOOLEAN NOT NULL,
    "productos" JSONB NOT NULL,
    "consumo" JSONB NOT NULL,
    "balance" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receta_items" ADD CONSTRAINT "receta_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_items" ADD CONSTRAINT "receta_items_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "insumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodega_insumos" ADD CONSTRAINT "bodega_insumos_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "insumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
