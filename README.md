# 🎯 NowaraJS - Logger

![nowarajs-logger-wall](https://github.com/user-attachments/assets/8ed0c4fa-f41a-4d86-bbba-d7a3aa49db47)

## 📌 Table of Contents

- [🎯 NowaraJS - Logger](#-nowarajs---logger)
	- [📌 Table of Contents](#-table-of-contents)
	- [📝 Description](#-description)
	- [✨ Features](#-features)
	- [🔧 Installation](#-installation)
	- [⚙️ Usage](#-usage)
		- [Basic Setup](#basic-setup)
		- [Multiple Sinks](#multiple-sinks)
		- [Custom Sinks](#custom-sinks)
		- [Type-Safe Logging](#type-safe-logging)
		- [Error Handling](#error-handling)
		- [Flushing and Closing](#flushing-and-closing)
		- [Configuration](#configuration)
	- [⚖️ License](#-license)
	- [📧 Contact](#-contact)

## 📝 Description

> A TypeScript library that provides a modular, type-safe, and worker-based logging system designed specifically for Bun.

**@nowarajs/logger** is a high-performance, asynchronous logging system built on top of Bun's worker threads. It provides a simple sink-based architecture for routing logs to multiple destinations (console, file, custom) with automatic type safety and zero-blocking guarantees.

## ✨ Features

- ⚡ **Non-blocking**: All logging operations are processed in a worker thread
- 🔒 **Type-safe**: Full TypeScript support with type inference for logged objects
- 🎯 **Sink Pattern**: Route logs to multiple destinations (console, file, custom)
- 📦 **Built-in Sinks**: Console and file logger included out of the box
- 🔧 **Custom Sinks**: Easily create custom sinks for your specific needs
- 🔄 **Batched Processing**: Automatic batching for better performance
- 📊 **Log Levels**: ERROR, WARN, INFO, DEBUG, LOG
- 🎛️ **Configurable**: Control batch size, timeout, queue limits and more
- 🔔 **Event-driven**: Listen to lifecycle events (flush, close, errors)

## 🔧 Installation

```bash
bun add @nowarajs/logger
```

### Peer Dependencies
#### Required :
```bash
bun add @nowarajs/error @nowarajs/typed-event-emitter
```

## ⚙️ Usage

### Basic Setup

```typescript
import { Logger } from '@nowarajs/logger';
import { ConsoleLoggerSink } from '@nowarajs/logger/sinks';

// Create a logger and register a console sink
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink);

// Log messages
logger.info('Application started');
logger.warn('This is a warning');
logger.error('An error occurred');
logger.debug('Debug info');
logger.log('Generic log');

// Close the logger when done
await logger.close();
```

### Multiple Sinks

```typescript
import { Logger } from '@nowarajs/logger';
import { ConsoleLoggerSink, FileLoggerSink } from '@nowarajs/logger/sinks';

// Register multiple sinks
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink)
  .registerSink('file', FileLoggerSink, './app.log');

// Log to all sinks
logger.info('This goes to console and file');

// Log to specific sinks only
logger.error('Only in file', ['file']);
logger.warn('Only in console', ['console']);

await logger.close();
```

### Custom Sinks

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

logger.info('Logged to database');
await logger.close();
```

### Type-Safe Logging

One of the most powerful features is **automatic type safety**. When you create typed sinks, TypeScript automatically infers the correct object shape for logging. When using multiple sinks, it even creates an **intersection type** of all sink types.

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

#### Multiple Typed Sinks with Intersection

When logging to multiple typed sinks at the same time, TypeScript automatically creates an **intersection** of all types:

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

// ❌ TypeScript error: Missing 'endpoint', 'method', 'statusCode'
logger.error({
  userId: 789,
  action: 'error',
  // Error: Missing api properties
}, ['user', 'api']);
```

#### Mixed Typed and Untyped Sinks

When mixing typed and untyped sinks (like `ConsoleLoggerSink` which accepts `unknown`), the intersection includes `unknown`, allowing flexible logging:

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

```typescript
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink);

// Listen for errors
logger.on('sinkError', (error) => {
  console.error('Logger error:', error.message);
});

logger.on('registerSinkError', (error) => {
  console.error('Failed to register sink:', error.message);
});

logger.info('Safe to log');
await logger.close();
```

### Flushing and Closing

```typescript
const logger = new Logger()
  .registerSink('console', ConsoleLoggerSink);

logger.info('First message');
logger.info('Second message');

// Wait for all pending logs to be processed
await logger.flush();

// Close the logger and release resources (internally calls flush)
await logger.close();
```

### Configuration

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


## ⚖️ License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.

## 📧 Contact

- Mail: [nowarajs@pm.me](mailto:nowarajs@pm.me)
- GitHub: [NowaraJS](https://github.com/NowaraJS)