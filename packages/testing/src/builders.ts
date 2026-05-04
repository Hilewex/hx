export function buildFakeId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function buildFakeDate(): string {
  return new Date().toISOString();
}
