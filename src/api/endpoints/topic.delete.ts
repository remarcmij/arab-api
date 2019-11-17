import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../ApiError';
import { deleteTopic as contentDeleteTopic } from '../content';
import { debouncedRebuildAutoCompletions } from '../db';

export const deleteTopic = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await contentDeleteTopic(req.params.filename);
    debouncedRebuildAutoCompletions();
    next();
  } catch (error) {
    ApiError.passNext(next, { status: 400, error });
  }
};
