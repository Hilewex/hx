export type SmokeResult = 'PASS' | 'FAIL' | 'SKIPPED';

export interface SmokeRunner {
  name: string;
  run: (baseUrl: string) => Promise<{ result: SmokeResult; message?: string }>;
}
