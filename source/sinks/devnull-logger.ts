import type { LoggerSink } from '#/types/logger-sink';

/**
 * DevNullLoggerSink implements LoggerSink to discard all logs (like /dev/null).
 * Useful for benchmarking the logger overhead without I/O.
 */
export class DevNullLoggerSink<TLogObject = unknown> implements LoggerSink<TLogObject> {
	public log(): void {
		// Do nothing - discard the log
	}
}
