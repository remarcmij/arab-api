import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../ApiError';
import { removeContentAndTopic } from '../content';

export const deleteTopic = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await removeContentAndTopic(req.params.filename);
    res.sendStatus(200);
  } catch (error) {
    ApiError.passNext(next, { status: 400, error });
  }
};
