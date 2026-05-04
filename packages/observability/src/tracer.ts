export interface TraceContext {
  traceId: string;
  spanId: string;
}

export interface Tracer {
  startSpan(name: string): TraceContext;
  endSpan(spanId: string): void;
}
