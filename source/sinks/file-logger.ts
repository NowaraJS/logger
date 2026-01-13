import type { FileSink } from 'bun';

import type { LogLevels } from '#/types/log-levels';
import type { LoggerSink } from '#/types/logger-sink';

/**
 * FileLoggerSink implements LoggerSink to provide logging functionality to the file system.
 * Uses Bun.FileSink for efficient buffered appending (works in worker context).
 */
export class FileLoggerSink<TLogObject = unknown> implements LoggerSink<TLogObject> {
	public readonly path: string;
	private readonly _sink: FileSink;
	private _isClosed = false;

	public constructor(path: string) {
		this.path = path;
		this._sink = Bun.file(path).writer();
	}

	public log(level: LogLevels, timestamp: number, object: TLogObject): void {
		if (this._isClosed)
			return;
		const logEntry = JSON.stringify({ timestamp, level, content: object }) + '\n';
		this._sink.write(logEntry);
	}

	public async close(): Promise<void> {
		if (this._isClosed)
			return;
		this._isClosed = true;
		await this._sink.end();
	}
}

