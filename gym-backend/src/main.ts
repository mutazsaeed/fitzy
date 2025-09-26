import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }, // يحوّل قيم الـquery لأرقام تلقائياً
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
