import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { ThrottleExceptionFilter } from "./common/throttle-exception.filter";
import * as express from "express";
import type { NextFunction, Request, Response } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lemon Squeezy verifies webhooks with HMAC over the raw JSON body.
  // Flutterwave uses the `verif-hash` header on normal JSON — no raw parser needed.
  app.use(
    "/api/v1/webhooks/lemon-squeezy",
    express.raw({ type: "application/json" }),
    (req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
      try {
        req.body = JSON.parse((req.body as Buffer).toString("utf8"));
      } catch {
        req.body = {};
      }
      next();
    },
  );

  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new ThrottleExceptionFilter());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  console.log(`PlotPin API running on http://localhost:${port}/api/v1`);
}

bootstrap();
