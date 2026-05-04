import { createPanelShell } from './bootstrap/app';

export const appName = "Panel App Shell";

export function bootstrap() {
  console.log(`Starting ${appName}...`);
  const app = createPanelShell();
  app.mount();
}

// Auto-start if run directly
if (require.main === module) {
  bootstrap();
}
