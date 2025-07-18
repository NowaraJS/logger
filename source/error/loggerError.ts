import type { LoggerErrorOptions } from './types/loggerErrorOptions';

import { randomUUID } from 'crypto';

// const randomUuid = await randomUUID();

/**
* A custom error class that extends the native {@link Error} class, providing additional properties
* such as a unique identifier, error key, HTTP status code, and cause.
*
* @typeParam T - The type of the cause of the error, which can be any object or error.
*
* @example
* The following example demonstrates how to throw and catch a LoggerError.
* ```typescript
* try {
*   throw new LoggerError({
*     message: 'An error occurred',
*     key: 'example.error',
*     cause: new Error('Original error')
*   });
* } catch (error) {
*   if (error instanceof LoggerError) {
*    console.error(`Error UUID: ${error.uuid}`);
*     console.error(`Error Date: ${error.date}`);
*     console.error(`Error Key: ${error.key}`);
*     console.error(`Cause: ${error.cause}`);
*   }
* }
* ```
*
* @example
* The following example demonstrates how to create a LoggerError with a custom cause type.
* ```typescript
* const loggerError = new LoggerError<{ foo: string }>({
*     message: 'Custom error with cause',
*     key: 'logger.error.custom_error',
*     cause: { foo: 'bar' },
* });
* console.log(loggerError.cause); // { foo: 'bar' }
* ```
*/
export class LoggerError<const TCause = unknown> extends Error {
	/**
	* The cause of the error, typically used to store the original error or additional context.
	*/
	public override readonly cause: TCause | undefined;

	/**
	* The unique identifier of the error, automatically generated using UUID v7.
	* This identifier is particularly useful for tracking errors in logs.
	*/
	private readonly _uuid: string = randomUUID();

	/**
	* The date when the error was created, automatically set to the current date and time.
	*/
	private readonly _date: Date = new Date();

	/**
	* A unique key identifying the type of error, useful for localization or error handling.
	*/
	private readonly _key: string;

	/**
	* Creates a new instance of the LoggerError class.
	*
	* @param loggerErrorOptions - The options for the Komi error. ({@link LoggerErrorOptions})
	*/
	public constructor(loggerErrorOptions?: Readonly<LoggerErrorOptions<TCause>>) {
		super(loggerErrorOptions?.message);
		super.name = 'LoggerError';
		this.cause = loggerErrorOptions?.cause;
		this._key = loggerErrorOptions?.key || '';
	}

	/**
	* Gets the unique identifier of the error.
	* @returns The UUID of the error.
	*/
	public get uuid(): string {
		return this._uuid;
	}

	/**
	* Gets the date when the error was created.
	* @returns The creation date of the error.
	*/
	public get date(): Date {
		return this._date;
	}

	/**
	* Gets the error key, which identifies the type of error.
	* @returns The key associated with the error.
	*/
	public get key(): string {
		return this._key;
	}
}