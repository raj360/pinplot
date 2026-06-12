import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Response } from "express";

/** Explore map search, friendly 429 body + Retry-After for client UX. */
@Catch(ThrottlerException)
export class ThrottleExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response.setHeader("Retry-After", "60");
    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: "Too Many Requests",
      message:
        "Too many map searches. Please wait about a minute, then try again.",
    });
  }
}
