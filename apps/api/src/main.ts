import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3001;
  app.use(cookieParser());
  app.enableCors({ origin: [process.env.ORIGIN_URL], credentials: true });
  await app.listen(port);

  console.log(`🚀 Backend server is listening on port ${port}`);
}
bootstrap();
