# 📦 NowaraJS - Logger

![nowarajs-logger-wall](https://github.com/user-attachments/assets/8ed0c4fa-f41a-4d86-bbba-d7a3aa49db47)

## 📌 Table of contents

- [📦 Logger](#-logger)
- [📌 Table of contents](#-table-of-contents)
- [📝 Description](#-description)
    - [✨ Key Features](#-key-features)
    - [🏗️ Architecture](#-architecture)
- [🚀 Usage](#-usage)
    - [Basic Setup](#basic-setup)
    - [Multiple Sinks](#multiple-sinks)
    - [Custom Sinks with Advanced Type Safety](#custom-sinks-with-advanced-type-safety)
        - [Typed Sink Implementation](#typed-sink-implementation)
        - [Body Intersection with Multiple Sinks](#body-intersection-with-multiple-sinks)
        - [Mixed Sink Types](#mixed-sink-types)
    - [Error Handling](#error-handling)
    - [Sink Management](#sink-management)
    - [Available Log Levels](#available-log-levels)
    - [Configuration Options](#configuration-options)
- [🌟 Documentation](#-documentation)
- [⚖️ License](#-license)
- [📧 Contact](#-contact)## 📝 Description

**@nowarajs/logger** is a modular, type-safe, and sink-based logging library designed specifically for Bun. It provides a flexible and high-performance logging system with the following key features:

### ✨ Key Features

- **🔄 Non-blocking Architecture**: Uses transform streams and async processing for optimal performance
- **🎯 Sink Pattern**: Multiple logging sinks (console, file, custom) that can be used individually or combined
- **🛡️ Type Safety**: Full TypeScript support with strict typing for better development experience
- **⚡ High Performance**: Queue-based system with configurable buffer limits (default: 10,000 logs)
- **🎨 Flexible Logging Levels**: Support for ERROR, WARN, INFO, DEBUG, and LOG levels
- **🔗 Event-Driven**: Emits typed events for error handling and lifecycle management
- **🔧 Immutable API**: Each operation returns a new logger instance for better state management
- **📦 Built-in Sinks**: Console logger with colorization and file logger included
- **🛠️ Custom Sink Support**: Easily create and register custom logging sinks with advanced type safety
- **📜 Body Intersection**: Automatically infers and enforces correct types based on selected sinks using TypeScript's body intersection feature

### 🏗️ Architecture

The logger uses a transform stream to process log entries asynchronously. Each log is queued and processed through the configured sinks. The system handles backpressure automatically and provides error isolation between sinks.

## 🚀 Usage

### Basic Setup

```typescript
import { Logger } from '@nowarajs/logger';
import { ConsoleLoggerSink, FileLoggerSink } from '@nowarajs/logger/sinks';

// Create a logger with console strategy
const logger = new Logger()
    .registerStrategy('console', new ConsoleLoggerSink(true)); // with colors

// Log messages
logger.info('Application started successfully');
logger.error('An error occurred');
logger.debug('Debug information', ['console']); // specific strategy
```

### Multiple Sinks

```typescript
// Combine multiple sinks
const logger = new Logger()
    .registerStrategy('console', new ConsoleLoggerSink(true))
    .registerStrategy('file', new FileLoggerSink('./app.log'));

// Logs to both console and file
logger.info('This goes to both sinks');

// Log to specific sinks only
logger.error('Critical error', ['file']); // only to file
logger.warn('Warning message', ['console']); // only to console
```

### Custom Sinks with Advanced Type Safety

The most powerful feature of @nowarajs/logger is its **advanced type safety system**. You can create custom logging sinks with typed objects, and TypeScript will automatically infer and enforce the correct types based on your selected sinks through **body intersection**.

#### Typed Sink Implementation

When you implement `LoggerSink<TLogObject>`, you specify the exact type of object that sink expects:

```typescript
import { Logger } from '@nowarajs/logger';
import type { LoggerSink, LogLevels } from '@nowarajs/logger/types';

// Define specific interfaces for different logging contexts
interface DatabaseLog {
    userId: number;
    action: string;
    metadata?: Record<string, unknown>;
}

interface ApiLog {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
}

// Create typed sinks
class DatabaseLoggerStrategy implements LoggerSink<DatabaseLog> {
    public async log(level: LogLevels, date: Date, object: DatabaseLog): Promise<void> {
        // object is strictly typed as DatabaseLog
        await saveToDatabase({ 
            level, 
            date, 
            userId: object.userId,
            action: object.action,
            metadata: object.metadata 
        });
    }
}


// You can just put the type directly in the log method and it will be automatically inferred
class ApiLoggerStrategy implements LoggerSink {
    public async log(level: LogLevels, date: Date, object: ApiLog): Promise<void> {
        // object is strictly typed as ApiLog
        await sendToMonitoring(`${object.method} ${object.endpoint} - ${object.statusCode} (${object.responseTime}ms)`);
    }
}

// Register typed sinks
const logger = new Logger()
    .registerStrategy('database', new DatabaseLoggerStrategy())
    .registerStrategy('api', new ApiLoggerStrategy())
    .registerStrategy('console', new ConsoleLoggerSink()); // ConsoleLoggerSink<unknown>

// ✅ TypeScript enforces the correct types based on selected sinks
logger.info({ 
    userId: 123, 
    action: 'login',
    metadata: { ip: '192.168.1.1' } 
}, ['database']); // Only DatabaseLog type required

logger.error({
    endpoint: '/api/users',
    method: 'POST',
    statusCode: 500,
    responseTime: 1250
}, ['api']); // Only ApiLog type required

// ❌ TypeScript error: Missing required properties
logger.info({
    userId: 123,
    action: 'login'
    // Error: object doesn't match ApiLog interface
}, ['api']);
```

#### Body Intersection with Multiple Sinks

When using multiple sinks simultaneously, @nowarajs/logger creates a **type intersection** of all selected sink types using the `BodiesIntersection` utility type:

```typescript
// ✅ TypeScript requires intersection of both types when using multiple sinks
logger.warn({
    userId: 123,
    action: 'failed_request',
    endpoint: '/api/users',
    method: 'POST', 
    statusCode: 400,
    responseTime: 200
}, ['database', 'api']); // Both DatabaseLog & ApiLog types required

// ❌ TypeScript error: Missing ApiLog properties
logger.error({
    userId: 123,
    action: 'error'
    // Error: Missing endpoint, method, statusCode, responseTime
}, ['database', 'api']);

// ✅ When no sinks specified, uses all sinks (intersection of all types)
logger.log({
    userId: 123,
    action: 'system_event',
    endpoint: '/health',
    method: 'GET',
    statusCode: 200,
    responseTime: 50
}); // DatabaseLog & ApiLog & unknown (console) intersection required
```

#### Mixed Sink Types

You can mix typed and untyped sinks. The intersection will include `unknown` for untyped sinks:

```typescript
// Using typed + untyped sinks  
logger.info({
    userId: 123,
    action: 'mixed_log',
    additionalData: 'any value' // ✅ Allowed due to intersection with unknown
}, ['database', 'console']); // Type: DatabaseLog & unknown

// TypeScript allows additional properties when unknown is in the intersection
logger.debug({
    userId: 123,
    action: 'debug_info',
    debugLevel: 3,
    stackTrace: ['frame1', 'frame2'],
    customField: { nested: 'data' }
}, ['database', 'console']); // ✅ Extra properties allowed due to unknown intersection
```

### Error Handling

```typescript
const logger = new Logger()
    .registerStrategy('console', new ConsoleLoggerSink());

// Listen for errors
logger.on('error', (error) => {
    console.error('Logger error:', error);
});

// Listen for completion
logger.on('end', () => {
    console.log('All pending logs processed');
});
```

### Sink Management

```typescript
let logger = new Logger();

// Add sinks
logger = logger
    .registerStrategy('console', new ConsoleLoggerSink())
    .registerStrategy('file', new FileLoggerSink('./app.log'));

// Add multiple sinks at once
logger = logger.registerStrategies([
    ['database', new DatabaseLoggerStrategy()],
    ['remote', new RemoteLoggerStrategy()]
]);

// Remove sinks
logger = logger.unregisterStrategy('database');
logger = logger.unregisterStrategies(['file', 'remote']);

// Clear all sinks
logger = logger.clearStrategies();
```

### Available Log Levels

```typescript
logger.error('Error message');   // ERROR level
logger.warn('Warning message');  // WARN level  
logger.info('Info message');     // INFO level
logger.debug('Debug message');   // DEBUG level
logger.log('Generic message');   // LOG level
```

### Configuration Options

```typescript
// Custom queue size (default: 10,000)
const logger = new Logger({}, 5000);

// With initial sinks
const logger = new Logger({
    console: new ConsoleLoggerSink(true),
    file: new FileLoggerSink('./app.log')
});
```

## 🌟 Documentation

- [Reference Documentation](https://nowarajs.github.io/logger)


## ⚖️ License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.

## 📧 Contact

- GitHub: [NowaraJS](https://github.com/NowaraJS)
- Package: [@nowarajs/logger](https://www.npmjs.com/package/@nowarajs/logger)

