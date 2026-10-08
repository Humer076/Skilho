import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as net from 'net';

function checkHost(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function isPortAvailable(port: number): Promise<boolean> {
  const hosts = ['0.0.0.0', '127.0.0.1', '::'];
  for (const host of hosts) {
    const ok = await checkHost(port, host);
    if (!ok) return false;
  }
  return true;
}

async function findAvailablePort(startPort: number, maxAttempts = 100): Promise<number> {
  for (let p = startPort; p < startPort + maxAttempts; p++) {
    if (await isPortAvailable(p)) {
      return p;
    }
  }
  throw new Error(`Could not find an available port between ${startPort} and ${startPort + maxAttempts - 1}`);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    credentials: true,
  });

  const preferredPort = parseInt(process.env.PORT || '3000', 10);
  let activePort = preferredPort;

  if (!(await isPortAvailable(preferredPort))) {
    activePort = await findAvailablePort(preferredPort + 1);
    logger.warn(`⚠ Port ${preferredPort} is in use, falling back to port ${activePort} instead.`);
  }

  await app.listen(activePort);
  logger.log(`🚀 Application is running on: http://localhost:${activePort}`);
}
bootstrap();