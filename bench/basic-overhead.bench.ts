/* eslint-disable camelcase */
import { createWriteStream } from 'fs';
import { bench, do_not_optimize, group, run, summary, barplot } from 'mitata';
import pino from 'pino';

import { Logger } from '#/logger.ts';
import { DevNullLoggerSink } from '#/sinks/devnull-logger.ts';

const nowaraLogger = new Logger()
	.registerSink('devnull', DevNullLoggerSink);

const pinoNodeStreamLogger = pino(createWriteStream('/dev/null'));
const pinoMinLengthLogger = pino(pino.destination({ dest: '/dev/null', minLength: 4096 }));
const pinoDestLogger = pino(pino.destination('/dev/null'));

barplot(() => {
	summary(() => group('🎯 [10k] - Nowara Logger with worker & Pino (SANS I/O)', () => {
		bench('Nowara Logger', async () => {
			for (let i = 0; i < 10_000; ++i)
				do_not_optimize(nowaraLogger.info('Hello world', ['devnull']));
			await nowaraLogger.flush();
		})
			.gc('inner');


		bench('Pino (Node Stream)', async () => {
			for (let i = 0; i < 10_000; ++i)
				do_not_optimize(pinoNodeStreamLogger.info('Hello world'));
			await new Promise<void>((resolve) => {
				pinoNodeStreamLogger.flush(() => {
					resolve();
				});
			});
		})
			.gc('inner');

		bench('Pino (Node Stream)', async () => {
			for (let i = 0; i < 10_000; ++i)
				do_not_optimize(pinoNodeStreamLogger.info('Hello world'));

			await new Promise<void>((resolve) => {
				pinoNodeStreamLogger.flush(() => {
					resolve();
				});
			});
		})
			.gc('inner');

		bench('Pino (Min Length)', async () => {
			for (let i = 0; i < 10_000; ++i)
				do_not_optimize(pinoMinLengthLogger.info('Hello world'));

			await new Promise<void>((resolve) => {
				pinoMinLengthLogger.flush(() => {
					resolve();
				});
			});
		})
			.gc('inner');

		bench('Pino (Destination)', async () => {
			for (let i = 0; i < 10_000; ++i)
				do_not_optimize(pinoDestLogger.info('Hello world'));
			await new Promise<void>((resolve) => {
				pinoDestLogger.flush(() => {
					resolve();
				});
			});
		})
			.gc('inner');
	}));
});


await run({
	colors: true
});

await nowaraLogger.flush();

console.log('\n✅ Benchmarks completed');
process.exit(0);