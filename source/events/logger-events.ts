import type { BaseError } from '@nowarajs/error';

export interface LoggerEvent {
	error: [BaseError<{
		sinkName: string;
		object: unknown;
		error: Error;
	}>];
	end: [];
}