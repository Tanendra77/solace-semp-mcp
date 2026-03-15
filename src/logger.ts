import winston from 'winston';
import path from 'path';

function getDateSuffix(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}`;
}

export function createLogger(): winston.Logger {
  const level = process.env['LOG_LEVEL'] === 'debug' ? 'debug' : 'info';
  const logDir = 'logs';
  const transports: winston.transport[] = [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: path.join(logDir, `info-${getDateSuffix()}.log`), level: 'info' }),
  ];
  if (level === 'debug') {
    transports.push(new winston.transports.File({ filename: path.join(logDir, `debug-${getDateSuffix()}.log`), level: 'debug' }));
  }
  return winston.createLogger({ level, format: winston.format.combine(winston.format.timestamp(), winston.format.json()), transports });
}

export const logger = createLogger();
