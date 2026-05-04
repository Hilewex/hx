import { createAppShell } from './bootstrap/app';

export const appName = "Web App Shell";

export function bootstrap() {
  console.log(`Starting ${appName}...`);
  const app = createAppShell();
  app.mount();
}

// Auto-start if run directly
if (require.main === module) {
  bootstrap();
}
