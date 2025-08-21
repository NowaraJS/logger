import type { LoggerSink } from './loggerSink';

export type SinkBody<TSink, Key extends keyof TSink> =TSink[Key] extends LoggerSink<infer TBody> ? TBody : never;
