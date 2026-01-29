import type { LoggerSink } from '#/types/logger-sink';
import type { LogLevels } from '#/types/log-levels';

/**
 * ConsoleLoggerSink implements LoggerSink to provide logging functionality to the console.
 */
export class ConsoleLoggerSink<TLogObject = unknown> implements LoggerSink<TLogObject> {
	public log(level: LogLevels, timestamp: number, object: TLogObject): void {
		const logEntry = { timestamp, level, content: object };
		const logLevel: Lowercase<LogLevels> = level.toLowerCase() as Lowercase<LogLevels>;
		console[logLevel]?.(JSON.stringify(logEntry));
	}
}
