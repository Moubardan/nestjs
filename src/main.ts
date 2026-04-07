import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Validation globale ────────────────────────────────────────────
  // OBLIGATOIRE : sans ça, les décorateurs class-validator sur les DTOs
  // ne sont que des annotations inertes. ValidationPipe les active.
  //   whitelist: true            → propriétés non déclarées dans le DTO silencieusement ignorées
  //   forbidNonWhitelisted: true → lève une 400 si propriété inconnue reçue
  //   transform: true            → cast automatique (query string "1" → number 1)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Exception Filter global ───────────────────────────────────────
  // Intercepte toutes les HttpException de toute l'application.
  // Format de réponse d'erreur uniforme : { statusCode, timestamp, path, method, message }
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
  console.log('✅ Application démarrée sur http://localhost:3000');
}

bootstrap();
