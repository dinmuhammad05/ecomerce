import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { QueryFailedError } from 'typeorm';
import * as geoip from 'geoip-lite';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorType = 'InternalServerError';

    // Xatolik turini aniqlash
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const responseBody = exception.getResponse();

      // Agar ThrottlerException (429) bo'lsa - bu DDoS urinish bo'lishi mumkin
      if (httpStatus === 429) {
        // 429 - Too Many Requests
        message = 'Rate limit exceeded (Potential DDoS attack)';
        errorType = 'TooManyRequests';
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const msg = (responseBody as any).message;
        message = Array.isArray(msg)
          ? msg
          : msg || (responseBody as any).error || message;
        errorType = (responseBody as any).error || errorType;
      } else if (typeof responseBody === 'string') {
        message = responseBody;
      }
    } else if (exception instanceof QueryFailedError) {
      if ((exception as any).code === '23505') {
        httpStatus = HttpStatus.CONFLICT;
        message = 'Duplicate entry';
        errorType = 'Conflict';
      } else {
        message = 'Database error';
      }
    }
    // console.log(exception);

    // ----------------------------------------------------
    // YANGI: IP, Davlat va Device ni aniqlash
    // ----------------------------------------------------
    // IP ni aniqlash (Proxy orqasidan bo'lsa ham)
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip ||
      'Unknown IP';

    // Mamlakatni aniqlash
    const geo = geoip.lookup(clientIp);
    const country = geo ? geo.country : 'Unknown/Local'; // Masalan: 'UZ', 'US', 'RU'

    const userAgent = request.headers['user-agent'] || 'Unknown Device';

    // Log obyekti
    const errorLog = {
      statusCode: httpStatus,
      message: message,
      path: request.url,
      method: request.method,
      ip: clientIp,
      country: country,
      device: userAgent,
      timestamp: new Date().toISOString(),
    };

    // LOG YOZISH MANTIQI
    if (httpStatus === 429) {
      // Agar limitdan oshib ketsa (DDoS gumoni), buni WARNING sifatida alohida belgilaymiz
      this.logger.warn(
        `DDOS ALERT | IP: ${clientIp} (${country}) is spamming! | ${JSON.stringify(errorLog)}`,
      );
    } else if (httpStatus >= 500) {
      // Server xatolari
      this.logger.error(
        `SERVER ERROR | Country: ${country} | ${JSON.stringify(errorLog)}`,
        (exception as Error).stack,
      );
    } else {
      // Oddiy client xatolari
      this.logger.warn(
        `CLIENT ERROR | Country: ${country} | ${JSON.stringify(errorLog)}`,
      );
    }

    // Clientga javob
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      method: request.method,
      error: errorType,
      message: message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
