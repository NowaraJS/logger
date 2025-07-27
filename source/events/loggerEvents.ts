import type { BaseError } from '@nowarajs/error';

export interface LoggerEvent {
	error: [BaseError<{
		strategyName: string;
		object: unknown;
		error: Error;
	}>];
	end: [];
}