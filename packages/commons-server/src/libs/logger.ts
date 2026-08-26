import {
  createLogger,
  format as logFormat,
  Logger,
  transports as logsTransports
} from 'winston';
import {
  ConsoleTransportInstance,
  FileTransportInstance,
  FileTransportOptions
} from 'winston/lib/winston/transports';

export const createLoggerInstance = (
  fileTransportOptions?: FileTransportOptions | null
): Logger => {
  const transportsInstances: (
    | FileTransportInstance
    | ConsoleTransportInstance
  )[] = [new logsTransports.Console({ handleExceptions: true })];

  if (fileTransportOptions) {
    const fileTransport = new logsTransports.File({
      ...fileTransportOptions,
      handleExceptions: true
    });

    // The logger already declares exitOnError: false, but winston's file
    // transport buffers through an internal PassThrough, and logging to a
    // server whose transport was already closed makes that stream emit a
    // "write after end" error with no listener attached, which takes the whole
    // process down. It surfaces on Windows in the CLI suite, where every spec
    // emits SIGINT and therefore re-stops the servers of the specs before it.
    // Keep such a failure a logging failure.
    const raw = fileTransport as unknown as { _stream?: NodeJS.EventEmitter };

    fileTransport.on('error', () => undefined);

    if (raw._stream) {
      raw._stream.on('error', () => undefined);
    }

    transportsInstances.push(fileTransport);
  }

  return createLogger({
    level: 'info',
    format: logFormat.combine(logFormat.timestamp(), logFormat.json()),
    transports: transportsInstances,
    exitOnError: false
  });
};
