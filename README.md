# 🎯 NowaraJS Logger

![nowarajs-logger-wall](https://github.com/user-attachments/assets/8ed0c4fa-f41a-4d86-bbba-d7a3aa49db47)

Logging in Bun often means choosing between "fast but dumb" or "smart but blocking". I built NowaraJS Logger because I wanted both: a type-safe, sink-based system that never blocks your main thread.

## Why this package?

The goal is simple: **Stop your logs from slowing down your app.**

Most loggers either block on every write or lose type safety when you need structured logging. This package runs everything in a worker thread, batches automatically, and still gives you full TypeScript inference on what you log.

## 📌 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [License](#-license)
- [Contact](#-contact)

## ✨ Features

- ⚡ **Zero Blocking**: Every log goes through a worker thread – your main loop stays fast.
- 🔒 **Type-Safe**: TypeScript infers the shape of your logs. No more `any` everywhere.
- 🎯 **Sink Pattern**: Route logs to console, file, database, or your own custom destination.
- 🔄 **Smart Batching**: Logs are grouped automatically for better I/O performance.
- 🔔 **Event-Driven**: Listen to flush, close, and error events when you need them.

## 🔧 Installation

```bash
bun add @nowarajs/logger
```

You'll also need:
```bash
bun add @nowarajs/error @nowarajs/typed-event-emitter
```

## ⚙️ Usage

### Basic Setup

Create a logger, attach a sink, and start logging:

```typescript
import { Logger } from '@nowarajs/logger';
import { ConsoleLoggerSink } from '@nowarajs/logger/sinks';

// Create a logger and register a console sink
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink);

// Log messages (always pass an object)
logger.info({ message: 'Application started' });
logger.warn({ message: 'This is a warning' });
logger.error({ message: 'An error occurred', code: 500 });
logger.debug({ action: 'debug_info', data: { foo: 'bar' } });
logger.log({ event: 'generic_log' });

// Close the logger when done
await logger.close();
```

### Multiple Sinks

Need logs going to different places? Register as many sinks as you want:

```typescript
import { Logger } from '@nowarajs/logger';
import { ConsoleLoggerSink, FileLoggerSink } from '@nowarajs/logger/sinks';

// Register multiple sinks
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink)
  .registerSink('file', FileLoggerSink, './app.log');

// Log to all sinks
logger.info({ message: 'This goes to console and file' });

// Log to specific sinks only
logger.error({ message: 'Only in file' }, ['file']);
logger.warn({ message: 'Only in console' }, ['console']);

await logger.close();
```

### Custom Sinks

Have a weird logging requirement? Write your own sink:

```typescript
import type { LoggerSink, LogLevels } from '@nowarajs/logger/types';

// Create a custom sink
class DatabaseSink implements LoggerSink {
  public async log(level: LogLevels, timestamp: number, object: unknown): Promise<void> {
    // Your custom logging logic
    await saveToDatabase({ level, timestamp, object });
  }
}

const logger = new Logger()
  .registerSink('database', DatabaseSink);

logger.info({ event: 'user_created', userId: 42 });
await logger.close();
```

### Type-Safe Logging

This is where it gets interesting. When you define typed sinks, TypeScript knows exactly what shape your logs need. No more guessing, no more runtime surprises.

#### Single Typed Sink

```typescript
import type { LoggerSink, LogLevels } from '@nowarajs/logger/types';

// Define your log object type
interface UserLog {
  userId: number;
  action: string;
  timestamp?: Date;
}

// Create a typed sink
class UserLogSink implements LoggerSink<UserLog> {
  public async log(level: LogLevels, timestamp: number, object: UserLog): Promise<void> {
	console.log(`User ${object.userId} performed: ${object.action}`);
  }
}

const logger = new Logger()
  .registerSink('userLog', UserLogSink);

// ✅ TypeScript requires the correct shape
logger.info({
  userId: 123,
  action: 'login'
});

// ❌ TypeScript error: Missing required property 'action'
logger.info({
  userId: 123
  // Error: Property 'action' is missing
});
```

#### Multiple Typed Sinks

When logging to multiple sinks at once, TypeScript creates an intersection of all types. You need to satisfy all of them:

```typescript
interface UserLog {
  userId: number;
  action: string;
}

interface ApiLog {
  endpoint: string;
  method: string;
  statusCode: number;
}

class UserLogSink implements LoggerSink<UserLog> {
  public async log(level: LogLevels, timestamp: number, object: UserLog): Promise<void> {
	await saveUser(object);
  }
}

class ApiLogSink implements LoggerSink<ApiLog> {
  public async log(level: LogLevels, timestamp: number, object: ApiLog): Promise<void> {
	await saveApi(object);
  }
}

const logger = new Logger()
  .registerSink('user', UserLogSink)
  .registerSink('api', ApiLogSink);

// ✅ When using both sinks, you need BOTH types combined
logger.info({
  userId: 123,
  action: 'api_call',
  endpoint: '/users',
  method: 'POST',
  statusCode: 201
}, ['user', 'api']); // Logs to both sinks

// ✅ When using only one sink, only that type is required
logger.warn({
  userId: 456,
  action: 'failed_attempt'
}, ['user']); // Only UserLog type required

// ❌ TypeScript error: Missing api properties
logger.error({
  userId: 789,
  action: 'error',
}, ['user', 'api']);
```

#### Mixing Typed and Untyped Sinks

When you mix typed sinks with untyped ones (like `ConsoleLoggerSink` which accepts `unknown`), things stay flexible:

```typescript
interface DatabaseLog {
  query: string;
  duration: number;
}

class DatabaseLogSink implements LoggerSink<DatabaseLog> {
  public async log(level: LogLevels, timestamp: number, object: DatabaseLog): Promise<void> {
	await logToDatabase(object);
  }
}

const logger = new Logger()
  .registerSink('database', DatabaseLogSink)
  .registerSink('console', ConsoleLoggerSink); // Accepts unknown

// ✅ This works - intersection with unknown allows extra properties
logger.info({
  query: 'SELECT * FROM users',
  duration: 123,
  customData: 'anything goes'
}, ['database', 'console']);
```

### Error Handling

Things break. When they do, you'll want to know:

```typescript
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink);

// Listen for errors
logger.addListener('sinkError', (error) => {
  console.error('Logger error:', error.message);
});

logger.addListener('registerSinkError', (error) => {
  console.error('Failed to register sink:', error.message);
});

logger.info({ message: 'Safe to log' });
await logger.close();
```

### Flushing and Closing

When you need to make sure everything is written before shutting down:

```typescript
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink);

logger.info({ message: 'First message' });
logger.info({ message: 'Second message' });

// Wait for all pending logs to be processed
await logger.flush();

// Close the logger and release resources (internally calls flush)
await logger.close();
```

### Configuration

Fine-tune the batching and queue behavior:

```typescript
const logger = new Logger({
  maxPendingLogs: 5000,      // Max queued logs (default: 10,000)
  batchSize: 50,             // Logs per batch (default: 50)
  batchTimeout: 100,         // Ms before flushing batch (default: 0.1)
  maxMessagesInFlight: 100,  // Max batches being processed (default: 100)
  autoEnd: true,             // Auto-close on process exit (default: true)
  flushOnBeforeExit: true    // Flush before exit (default: true)
});
```

## 📚 API Reference

Full docs: [nowarajs.github.io/logger](https://nowarajs.github.io/logger/)

## ⚖️ License

MIT – Use it however you want.

## 📧 Contact

- Mail: [nowarajs@pm.me](mailto:nowarajs@pm.me)
- GitHub: [NowaraJS](https://github.com/NowaraJS)