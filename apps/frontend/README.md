# Control de Producción — Pastelería

Calculadora de consumo de insumos y costo de producción diaria. Reemplaza el
archivo Excel "CONTROL DE INSUMOS FINAL" por una aplicación que hace los
cálculos automáticamente.

## Requisitos

- Node.js 20 o superior

## Puesta en marcha

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
```

Otros comandos:

```bash
npm run build      # compila la versión de producción en dist/
npm run preview    # sirve la versión compilada
npx vitest run     # ejecuta las pruebas del motor de cálculo
```

## Cómo se usa

1. **Calculadora** — busca el producto o recórrelo por categoría, ingresa las
   tandas y presiona "Calcular producción".
2. **Resultados** — muestra el consumo consolidado de ingredientes, el detalle
   de cada producto (para verificar los cálculos) y el gasto total. Desde aquí
   se guarda en el historial, se exporta a Excel o se imprime.
3. **Administración → Recetas** — crear productos, agregar o quitar
   ingredientes, cambiar gramajes, activar o desactivar productos.
4. **Administración → Insumos y costos** — cargar el costo por kilo de cada
   insumo. Mientras un insumo no tenga costo, el gasto aparece como
   "Pendiente".
5. **Bodega** — registra los ingresos del día y las existencias de cada insumo,
   en gramos. Estos datos alimentan el balance del día.
6. **Historial** — producciones guardadas, con su consumo y gasto.

Los cambios en Administración solo quedan guardados al presionar
"Guardar cambios".

## Estructura

```
src/
  data/defaultCatalog.ts      35 recetas y 68 insumos extraídos del Excel
  lib/
    calculationEngine.ts      motor de cálculo (puro, sin dependencias de UI)
    calculationEngine.test.ts pruebas del motor
    persistence.ts            capa de guardado (hoy localStorage)
    exportExcel.ts            exportación a .xlsx
    format.ts                 formato de cantidades, moneda y fechas
    categorias.ts             categorías y sus colores
  components/                 componentes de interfaz
  pages/                      pantallas
  state/AppContext.tsx        estado global
  types/index.ts              tipos del dominio
```

El **motor de cálculo** no depende de React ni del navegador: recibe el
catálogo y las tandas, y devuelve el resultado. Por eso puede probarse solo
(`npx vitest run`) y trasladarse al backend sin cambios cuando exista.

La **capa de persistencia** (`lib/persistence.ts`) es el único archivo que
toca el almacenamiento. Cuando el backend esté listo, se reemplazan esas
cuatro funciones por llamadas `fetch` y el resto de la aplicación no cambia.

## Fórmulas

```
cantidad(producto, insumo) = gramos_por_tanda × tandas
consumo_total(insumo)      = suma de cantidad(p, insumo) en todos los productos
gasto(insumo)              = (consumo_total / 1000) × costo_por_kg
gasto_total                = suma de gasto(insumo)
```

Balance diario, equivalente a las columnas E–M de `TOTAL_DIA`:

```
total_bodega(insumo)   = ingresos + bodega
gastos_diarios(insumo) = consumo_total(insumo)
total_final(insumo)    = total_bodega - gastos_diarios
```

Un `total_final` negativo significa que el insumo no alcanza para la producción
programada. La aplicación lo marca en rojo y lo ordena primero; el Excel
original mostraba esos negativos sin ninguna alerta.

Los cálculos se hacen con precisión completa; el redondeo se aplica solo al
mostrar los valores.

## Diferencias respecto al Excel original

Están documentadas dentro de la aplicación, en el ícono de información del
encabezado. En resumen:

- **Desfase de tandas en galletas**: en el Excel cada receta de galleta tomaba
  el número de tandas de la receta anterior. Aquí cada producto usa el suyo.
- **Azúcar mal consolidada**: la fórmula de `TOTAL_DIA` omitía el azúcar de
  Bizcocho y Galleta Sin Gluten. El motor recorre todas las recetas, así que
  esa omisión ya no puede ocurrir.
- **Nombres corregidos**: "Red Velvet" (el Excel escribía "Velbet") y
  "Queso Flan" (la hoja tenía "Queso Oreo" como título por error).
- **"Nuez"** se interpretó como "Nuez Moscada" (5 g por receta, propio de una
  especia), distinta de "Nueces" como fruto seco.
- **Costos**: el Excel no tenía ninguno. Se cargan desde Administración.

## Validación

El resultado se comparó contra el Excel original para el escenario
Chocolate = 5 tandas y Red Velvet = 3 tandas: los 15 insumos involucrados
coinciden exactamente. Las pruebas automatizadas cubren el cálculo por tanda,
la consolidación entre productos, el manejo de costos pendientes y las
entradas inválidas.

La pantalla de Bodega y el balance del día se validaron contra la fila 6 de
`TOTAL_DIA` (harina: 693.570 en bodega − 485.710 consumidos = 207.860).

## Siguiente paso

Este es el frontend. El backend (Node.js + NestJS) y la base de datos
(PostgreSQL) están descritos en el plan de ruta del proyecto.
