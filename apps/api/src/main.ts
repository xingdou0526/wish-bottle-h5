import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173',
    credentials: false,
  });

  app.setGlobalPrefix('api');
  // 不挂全局 ValidationPipe：每个 controller 用 ZodValidationPipe 显式校验。
  // 全局 ValidationPipe(whitelist) 会剥掉没有 class-validator 装饰器的字段，
  // 而我们用 zod schema 校验，整个 body 会被洗成 {}。

  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[wishbottle-api] listening on http://localhost:${port}/api`);
}
bootstrap();
