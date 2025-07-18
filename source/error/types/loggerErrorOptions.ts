export interface LoggerErrorOptions<T = unknown> {
	/**
	* The error message describing what went wrong.
	*/
	message?: string;

	/**
	* A unique key identifying the type of error, useful for localization or error handling.
	*/
	key?: string;

	/**
	* The cause of the error, which can be an original error or additional context.
	*/
	cause?: T;
}