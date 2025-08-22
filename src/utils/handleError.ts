import { Response } from 'express';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

const logger = new Logger('handleError');

export function handleError(res: Response, error: unknown) {
  if (error instanceof HttpException) {
    return res.status(error.getStatus()).json({ message: error.message });
  }
  const details =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'object'
        ? JSON.stringify(error, null, 2)
        : JSON.stringify(error);

  logger.error(
    'Unhandled error',
    error instanceof Error ? error.stack : details,
  );
  return res
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
    .json({ message: 'Unexpected error' });
}
