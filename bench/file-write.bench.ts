/* eslint-disable camelcase */
import { createWriteStream, unlinkSync } from 'fs';
import { appendFile } from 'fs/promises';
import { barplot, bench, do_not_optimize, group, run, summary } from 'mitata';

const LOG_ENTRY = JSON.stringify({ timestamp: Date.now(), level: 'INFO', content: { message: 'Hello world' } }) + '\n';
const ITERATIONS = 1000;

// Test files
const FILES = {
	bunWrite: '/tmp/bench-bun-write.log',
	bunWriteAppend: '/tmp/bench-bun-write-append.log',
	writeStream: '/tmp/bench-write-stream.log',
	fsAppendFile: '/tmp/bench-fs-append.log'
};

// Cleanup before each run
const cleanup = (): void => {
	for (const file of Object.values(FILES))
		try {
			unlinkSync(file);
		} catch {
			// ignore
		}
};

cleanup();

barplot(() => {
	summary(() => group(`📝 File Write Comparison (${ITERATIONS} writes)`, () => {
		// Bun.write with read + append (current implementation)
		bench('Bun.write (read + rewrite)', async () => {
			const file = FILES.bunWrite;
			try {
				unlinkSync(file);
			} catch {
				// ignore
			}
			for (let i = 0; i < ITERATIONS; ++i) {
				const bunFile = Bun.file(file);
				const existing = await bunFile.exists() ? await bunFile.text() : '';
				do_not_optimize(await Bun.write(file, existing + LOG_ENTRY));
			}
		})
			.gc('inner');

		// Bun.write with FileSink (append mode)
		bench('Bun.FileSink (native append)', async () => {
			const file = FILES.bunWriteAppend;
			try {
				unlinkSync(file);
			} catch {
				// ignore
			}
			const sink = Bun.file(file).writer();
			for (let i = 0; i < ITERATIONS; ++i)
				do_not_optimize(sink.write(LOG_ENTRY));

			await sink.end();
		})
			.gc('inner');

		// Node.js createWriteStream (dynamic import simulation)
		bench('createWriteStream (Node)', async () => {
			const file = FILES.writeStream;
			try {
				unlinkSync(file);
			} catch {
				// ignore
			}
			const stream = createWriteStream(file, { flags: 'a', encoding: 'utf8' });
			for (let i = 0; i < ITERATIONS; ++i)
				do_not_optimize(stream.write(LOG_ENTRY));

			await new Promise<void>((resolve, reject) => {
				stream.end((err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		})
			.gc('inner');

		// fs/promises appendFile
		bench('fs/promises appendFile', async () => {
			const file = FILES.fsAppendFile;
			try {
				unlinkSync(file);
			} catch {
				// ignore
			}
			for (let i = 0; i < ITERATIONS; ++i)
				do_not_optimize(await appendFile(file, LOG_ENTRY));
		})
			.gc('inner');
	}));
});

await run();

cleanup();
