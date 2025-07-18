import { describe, expect, test } from 'bun:test';

import { LoggerError } from '#/error/loggerError';
import type { LoggerErrorOptions } from '#/error/types/loggerErrorOptions';

/**
 * Test data constants for consistent testing across all test suites.
 */
const testData = {
	completeErrorOptions: {
		message: 'An example error occurred',
		key: 'komi-logger.error.example',
		cause: { errorCode: 'E001', details: 'Invalid input data' }
	} as const,
	minimalErrorOptions: {
		message: 'Minimal error'
	} as const,
	errorKeys: {
		validation: 'komi-logger.error.validation.failed',
		authentification: 'komi-logger.error.auth.invalid_token',
		database: 'komi-logger.error.database.connection_failed'
	} as const
} as const;

/**
 * Custom type definitions for testing purposes.
 */
interface DatabaseErrorCause {
	readonly connectionString: string;
	readonly timeoutMs: number;
}

interface ValidationErrorCause {
	readonly field: string;
	readonly value: unknown;
	readonly rule: string;
}

/**
 * Helper function to create a LoggerError with complete options for testing purposes.
 * @returns A LoggerError instance with all properties set.
 */
const _createCompleteError = (): LoggerError<typeof testData.completeErrorOptions.cause> => new LoggerError(testData.completeErrorOptions);

/**
 * Helper function to create a minimal LoggerError for testing purposes.
 * @returns A LoggerError instance with minimal configuration.
 */
const _createMinimalError = (): LoggerError => new LoggerError(testData.minimalErrorOptions);

/**
 * Helper function to get current timestamp for date comparison tests.
 * @returns Current timestamp in milliseconds.
 */
const _getCurrentTimestamp = (): number => Date.now();

describe('LoggerError', () => {
	describe('when constructing with complete options', () => {
		test('should create instance with all specified properties', () => {
			const beforeCreation: number = _getCurrentTimestamp();
			const loggerError: LoggerError<typeof testData.completeErrorOptions.cause> = _createCompleteError();
			const afterCreation: number = _getCurrentTimestamp();

			expect(loggerError).toBeInstanceOf(LoggerError);
			expect(loggerError).toBeInstanceOf(Error);
			expect(loggerError.message).toBe(testData.completeErrorOptions.message);
			expect(loggerError.name).toBe('LoggerError');
			expect(loggerError.key).toBe(testData.completeErrorOptions.key);
			expect(loggerError.cause).toEqual(testData.completeErrorOptions.cause);
			expect(loggerError.stack).toBeDefined();
			expect(loggerError.uuid).toBeDefined();
			expect(loggerError.date).toBeDefined();
			expect(loggerError.date.getTime()).toBeGreaterThanOrEqual(beforeCreation);
			expect(loggerError.date.getTime()).toBeLessThanOrEqual(afterCreation);
		});

		test('should create instance with typed cause', () => {
			const databaseCause: DatabaseErrorCause = {
				connectionString: 'mssql://localhost:1433',
				timeoutMs: 5000
			};

			const errorOptions: LoggerErrorOptions<DatabaseErrorCause> = {
				message: 'Database connection failed',
				key: testData.errorKeys.database,
				cause: databaseCause
			};
			const loggerError = new LoggerError<DatabaseErrorCause>(errorOptions);

			expect(loggerError.cause).toEqual(databaseCause);
			expect(loggerError.cause?.connectionString).toBe('mssql://localhost:1433');
			expect(loggerError.cause?.timeoutMs).toBe(5000);
		});

		test('should create instance with Error cause', () => {
			const originalError: Error = new Error('Original error message');
			const errorOptions: LoggerErrorOptions<Error> = {
				message: 'Wrapped error',
				key: 'error.wrapper.example',
				cause: originalError
			};
			const loggerError = new LoggerError<Error>(errorOptions);

			expect(loggerError.cause).toBe(originalError);
			expect(loggerError.cause?.message).toBe('Original error message');
		});
	});

	describe('when constructing with partial options', () => {
		test('should create instance with minimal options and apply defaults', () => {
			const loggerError: LoggerError = _createMinimalError();

			expect(loggerError).toBeInstanceOf(LoggerError);
			expect(loggerError.message).toBe(testData.minimalErrorOptions.message);
			expect(loggerError.key).toBe('');
			expect(loggerError.cause).toBeUndefined();
		});

		test('should create instance with only key specified', () => {
			const errorOptions: LoggerErrorOptions = {
				key: testData.errorKeys.validation
			};
			const loggerError: LoggerError = new LoggerError(errorOptions);

			expect(loggerError.message).toBe('');
			expect(loggerError.key).toBe(testData.errorKeys.validation);
			expect(loggerError.cause).toBeUndefined();
		});
	});

	describe('when constructing with default options', () => {
		test('should create instance with all default values when no options provided', () => {
			const loggerError: LoggerError = new LoggerError();

			expect(loggerError).toBeInstanceOf(LoggerError);
			expect(loggerError).toBeInstanceOf(Error);
			expect(loggerError.message).toBe('');
			expect(loggerError.name).toBe('LoggerError');
			expect(loggerError.key).toBe('');
			expect(loggerError.cause).toBeUndefined();
			expect(loggerError.stack).toBeDefined();
			expect(loggerError.uuid).toBeDefined();
			expect(loggerError.date).toBeDefined();
		});

		test('should create instance with undefined options', () => {
			const loggerError: LoggerError = new LoggerError(undefined);

			expect(loggerError.message).toBe('');
			expect(loggerError.key).toBe('');
			expect(loggerError.cause).toBeUndefined();
		});
	});

	describe('when testing instance properties', () => {
		test('should generate unique UUIDs for different instances', () => {
			const error1: LoggerError = new LoggerError();
			const error2: LoggerError = new LoggerError();
			const error3: LoggerError = new LoggerError();

			expect(error1.uuid).not.toBe(error2.uuid);
			expect(error2.uuid).not.toBe(error3.uuid);
			expect(error1.uuid).not.toBe(error3.uuid);
			// check if UUIDs are in valid format (v4 for Node.js, v7 for Bun)
			expect(error1.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		test('should have creation dates close to current time', () => {
			const beforeCreation: number = _getCurrentTimestamp();
			const loggerError: LoggerError = new LoggerError();
			const afterCreation: number = _getCurrentTimestamp();

			expect(loggerError.date).toBeInstanceOf(Date);
			expect(loggerError.date.getTime()).toBeGreaterThanOrEqual(beforeCreation);
			expect(loggerError.date.getTime()).toBeLessThanOrEqual(afterCreation);
		});

		test('should have different creation dates for instances created at different times', async () => {
			const error1: LoggerError = new LoggerError();
			await new Promise((resolve: (value: unknown) => void): void => {
				setTimeout(resolve, 1);
			});
			const error2: LoggerError = new LoggerError();

			expect(error1.date.getTime()).toBeLessThan(error2.date.getTime());
		});
	});

	describe('when testing getter methods', () => {
		test('should return correct uuid value', () => {
			const loggerError: LoggerError = new LoggerError();
			const uuid: string = loggerError.uuid;

			expect(typeof uuid).toBe('string');
			expect(uuid).toHaveLength(36);
			expect(uuid).toBe(loggerError.uuid); // Should be consistent
		});

		test('should return correct date value', () => {
			const loggerError: LoggerError = new LoggerError();
			const date: Date = loggerError.date;

			expect(date).toBeInstanceOf(Date);
			expect(date).toBe(loggerError.date); // Should be the same reference
		});

		test('should return correct key value', () => {
			const loggerError: LoggerError = new LoggerError({
				key: testData.errorKeys.authentification
			});

			expect(loggerError.key).toBe(testData.errorKeys.authentification);
		});
	});

	describe('when testing Error inheritance', () => {
		test('should be throwable as Error', () => {
			expect(() => {
				throw new LoggerError({
					message: 'Test error',
					key: 'error.test'
				});
			}).toThrow(LoggerError);
		});

		test('should be catchable as Error', () => {
			try {
				throw new LoggerError({
					message: 'Test error for catching',
					key: 'error.catch.test'
				});
			} catch (error: unknown) {
				expect(error).toBeInstanceOf(Error);
				expect(error).toBeInstanceOf(LoggerError);
				if (error instanceof LoggerError) {
					expect(error.message).toBe('Test error for catching');
					expect(error.key).toBe('error.catch.test');
				}
			}
		});

		test('should maintain Error properties', () => {
			const loggerError: LoggerError = new LoggerError({
				message: 'Error with stack trace'
			});

			expect(loggerError.name).toBe('LoggerError');
			expect(loggerError.message).toBe('Error with stack trace');
			expect(loggerError.stack).toBeDefined();
			expect(typeof loggerError.stack).toBe('string');
		});
	});

	describe('when testing with complex cause types', () => {
		test('should handle validation error cause', () => {
			const validationCause: ValidationErrorCause = {
				field: 'email',
				value: 'invalid-email',
				rule: 'email_format'
			};
			const loggerError = new LoggerError<ValidationErrorCause>({
				message: 'Validation failed',
				key: testData.errorKeys.validation,
				cause: validationCause
			});

			expect(loggerError.cause).toEqual(validationCause);
			expect(loggerError.cause?.field).toBe('email');
			expect(loggerError.cause?.value).toBe('invalid-email');
			expect(loggerError.cause?.rule).toBe('email_format');
		});

		test('should handle nested error objects as cause', () => {
			const nestedCause = {
				primaryError: new Error('Primary failure'),
				secondaryError: new Error('Secondary failure'),
				context: {
					userId: 123,
					action: 'update_profile'
				}
			} as const;
			const loggerError = new LoggerError<typeof nestedCause>({
				message: 'Multiple errors occurred',
				key: 'error.multiple.failures',
				cause: nestedCause
			});

			expect(loggerError.cause?.primaryError).toBeInstanceOf(Error);
			expect(loggerError.cause?.secondaryError).toBeInstanceOf(Error);
			expect(loggerError.cause?.context.userId).toBe(123);
			expect(loggerError.cause?.context.action).toBe('update_profile');
		});
	});

	describe('when testing edge cases', () => {
		test('should handle empty string values', () => {
			const loggerError: LoggerError = new LoggerError({
				message: '',
				key: ''
			});

			expect(loggerError.message).toBe('');
			expect(loggerError.key).toBe('');
		});

		test('should handle null cause', () => {
			const loggerError = new LoggerError<null>({
				message: 'Error with null cause',
				cause: null
			});

			expect(loggerError.cause).toBeNull();
		});

		test('should handle primitive cause types', () => {
			const stringCause = 'Simple string error';
			const numberCause = 404;
			const booleanCause = false;

			const stringError = new LoggerError<string>({
				message: 'String cause error',
				cause: stringCause
			});
			const numberError = new LoggerError<number>({
				message: 'Number cause error',
				cause: numberCause
			});
			const booleanError = new LoggerError<boolean>({
				message: 'Boolean cause error',
				cause: booleanCause
			});

			expect(stringError.cause).toBe(stringCause);
			expect(numberError.cause).toBe(numberCause);
			expect(booleanError.cause).toBe(booleanCause);
		});
	});

	describe('when testing UUID integration', () => {
		test('should generate valid and unique UUIDs for error instances', () => {
			const error1 = new LoggerError({ message: 'Test error 1' });
			const error2 = new LoggerError({ message: 'Test error 2' });
			const error3 = new LoggerError({ message: 'Test error 3' });

			// All UUIDs should be valid format (v4 for Node.js, v7 for Bun)
			const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(error1.uuid).toMatch(uuidPattern);
			expect(error2.uuid).toMatch(uuidPattern);
			expect(error3.uuid).toMatch(uuidPattern);

			// All UUIDs should be unique
			expect(error1.uuid).not.toBe(error2.uuid);
			expect(error2.uuid).not.toBe(error3.uuid);
			expect(error1.uuid).not.toBe(error3.uuid);

			// UUIDs should be consistent for the same instance
			expect(error1.uuid).toBe(error1.uuid);
		});
	});
});
