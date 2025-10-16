export const LOGGER_ERROR_KEYS = {
	BEFORE_EXIT_CLOSE_ERROR: 'logger.error.before_exit_close_error',
	BEFORE_EXIT_FLUSH_ERROR: 'logger.error.before_exit_flush_error',
	NO_SINKS_PROVIDED: 'logger.error.no_sinks_provided',
	REGISTER_SINK_ERROR: 'logger.error.register_sink_error',
	SINK_ALREADY_ADDED: 'logger.error.sink_already_added',
	SINK_CLOSE_ERROR: 'logger.error.sink_close_error',
	SINK_LOG_ERROR: 'logger.error.sink_log_error'
} as const;