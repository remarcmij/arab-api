import { RequestHandler } from 'express';
import { withError } from '../ApiError';
import { deleteTopic as contentDeleteTopic } from '../content';
import { debouncedRebuildAutoCompletions } from '../db';

export const deleteTopic: RequestHandler = async (req, res, next) => {
  try {
    await contentDeleteTopic(req.params.filename);
    debouncedRebuildAutoCompletions();
    next();
  } catch (error) {
    withError(next)({ status: 400, error });
  }
};
