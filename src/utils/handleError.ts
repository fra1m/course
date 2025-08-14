import { Response } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

export function handleError(res: Response, error: unknown) {
  if (error instanceof HttpException) {
    return res.status(error.getStatus()).json({ message: error.message });
  }
  console.dir(error, { depth: null });
  return res
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
    .json({ message: 'Unexpected error' });
}
