import appRoot from 'app-root-path';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf } = format;

const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    format: combine(
      timestamp(),
      printf(info => `${info.timestamp} | ${info.message}`),
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: format.simple(),
    colorize: true,
  },
};

const logger = createLogger({
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

export default logger;
