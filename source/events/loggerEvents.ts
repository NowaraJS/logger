import type { LoggerError } from '#/error/loggerError';

export interface LoggerEvent {
	error: [LoggerError<{
		strategyName: string;
		object: unknown;
		error: Error;
	}>];
	end: [];
}