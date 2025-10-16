import type { BaseError } from '@nowarajs/error';

export interface LoggerEvent {
	onBeforeExitError: [BaseError<{ error: Error }>];
	registerSinkError: [BaseError<{
		sinkName: string;
		error: Error;
	}>];
	sinkError: [BaseError<{
		sinkName: string;
		object?: unknown;
		error: Error;
	}>];
	drained: [];
}