import { HttpStatus, Injectable, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { appConfig } from './config';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './infrastructure/exception/All-exception-filter';
import { winstonConfig } from './infrastructure/winston/winston.config';
import { contacts } from './common/document/swagger/admin/docs';

@Injectable()
class AppService {
  async main() {
    const app = await NestFactory.create(AppModule, {
      logger: winstonConfig,
    });

    app.enableCors({
      origin: ['http://localhost:5173'],
      credentials: true,
    });

    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());

    const httpAdapter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

    // validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        transformOptions: { enableImplicitConversion: true },
        validationError: { target: false },
        stopAtFirstError: true,
        disableErrorMessages: appConfig.NODE_ENV === 'production',
        exceptionFactory: (errors) => {
          const messages = errors
            .map((err) => Object.values(err.constraints || {}))
            .flat();
          return {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: messages,
            error: 'Unprocessable Entity',
          };
        },
      }),
    );

    // swagger
    const config = new DocumentBuilder()
      .setTitle('CRM School API')
      .setDescription('The CRM School API description')
      .setContact(
        contacts.setContact.name,
        contacts.setContact.url,
        contacts.setContact.email,
      )
      .setExternalDoc(contacts.docs.name, contacts.docs.url)
      .setVersion('1.0')
      .addTag('crm-school')
      .addBearerAuth({
        type: 'http',
        scheme: 'Bearer',
        in: 'Header',
      })
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    await app.listen(appConfig.port || 3000, () => {
      console.log(`Server started on port ${appConfig.port}`);
    });
  }
}

export default new AppService();
