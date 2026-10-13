import "reflect-metadata";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5174" });

  const sirveFrontend = servirFrontend(app);

  const puerto = Number(process.env.PORT) || 3001;
  await app.listen(puerto);

  console.log(`API escuchando en http://localhost:${puerto}/api`);
  if (sirveFrontend) {
    console.log(`Aplicación disponible en http://localhost:${puerto}`);
  }
}

/**
 * En el servidor, el backend también entrega el frontend compilado, para que
 * toda la aplicación viva en una sola dirección y un solo puerto.
 *
 * Busca la carpeta apps/frontend/dist (o la indicada en FRONTEND_DIST). Si no
 * existe — por ejemplo en desarrollo, donde el frontend lo sirve Vite — solo
 * se expone la API.
 */
function servirFrontend(app: NestExpressApplication): boolean {
  const carpeta = resolve(process.env.FRONTEND_DIST ?? join(process.cwd(), "..", "frontend", "dist"));
  const indice = join(carpeta, "index.html");

  if (!existsSync(indice)) {
    console.log(`Frontend compilado no encontrado en ${carpeta}: se sirve solo la API.`);
    return false;
  }

  app.useStaticAssets(carpeta, { index: false });

  // Las rutas del frontend (/bodega, /historial...) las resuelve React en el
  // navegador: cualquier GET que no sea de la API recibe el index.html.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(indice);
  });

  return true;
}

void bootstrap();
