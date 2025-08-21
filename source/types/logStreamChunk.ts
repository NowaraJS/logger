import type { LogLevels } from './logLevels';
import type { SinkMap } from './sinkMap';

/**
 * Internal log stream object for the queue.
 */
export interface LogStreamChunk<TLogObject, TSinks extends SinkMap> {
	/** ISO date string of the log event. */
	date: string;
	/** Log level. */
	level: LogLevels;
	/** The object to log. */
	object: TLogObject;
	/** Names of sinks to use. */
	sinksNames: (keyof TSinks)[];
}