import { appendFile } from 'fs/promises';

import type { LoggerSink } from '#/types/logger-sink';
import type { LogLevels } from '#/types/log-levels';

/**
* FileLoggerSink implements LoggerSink to provide logging functionality to the file system.
*/
export class FileLoggerSink implements LoggerSink {
	/**
	* Path to the file to log to.
	*/
	private readonly _path: string;

	/**
	* Constructor FileLoggerSink
	*
	* @param path - Path to the file to log to.
	*/
	public constructor(path: string) {
		this._path = path;
	}

	public async log(level: LogLevels, date: Date, object: unknown): Promise<void> {
		const prefixDate = `[${date.toISOString().replace(/T/, ' ').replace(/\..+/, '')}]`;
		const sanitizedObject: string = typeof object === 'string' ? object : JSON.stringify(object);
		const message = `${prefixDate} ${level} : ${sanitizedObject}`;
		await appendFile(this._path, `${message}\n`);
	}
}
