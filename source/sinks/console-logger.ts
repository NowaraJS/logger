import type { LoggerSink } from '#/types/logger-sink';
import type { LogLevels } from '#/types/log-levels';

/**
* ConsoleLoggerSink implements LoggerSink to provide logging functionality to the console.
*/
export class ConsoleLoggerSink<TLogObject = unknown> implements LoggerSink<TLogObject> {
	public async log(level: LogLevels, timestamp: number, object: TLogObject): Promise<void> {
		const sanitizedContent: string = typeof object === 'string' ? object : JSON.stringify(object);
		await Bun.write(Bun.stdout, `{"timestamp":${timestamp},"level":"${level}","content":${sanitizedContent}}\n`);
	}
}
