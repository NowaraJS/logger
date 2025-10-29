import type { LoggerSink } from '#/types/logger-sink';
import type { LogLevels } from '#/types/log-levels';

/**
* ConsoleLoggerSink implements LoggerSink to provide logging functionality to the console.
*/
export class ConsoleLoggerSink<TLogObject = unknown> implements LoggerSink<TLogObject> {
	public async log(level: LogLevels, timestamp: number, object: TLogObject): Promise<void> {
		const logEntry = { timestamp, level, content: object };
		await Bun.write(Bun.stdout, JSON.stringify(logEntry) + '\n');
	}
}
