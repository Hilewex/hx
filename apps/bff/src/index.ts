import './env';
import { createServer } from './server';
import { config } from './config';

export const appName = "BFF Service";

export function bootstrap() {
  console.log(`Starting ${appName} in ${config.NODE_ENV} mode...`);
  
  const server = createServer();
  server.start();

  // Graceful shutdown placeholder
  process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.stop();
    process.exit(0);
  });
}

// Auto-start if run directly
if (require.main === module) {
  bootstrap();
}
