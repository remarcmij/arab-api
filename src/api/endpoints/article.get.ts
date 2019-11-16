import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../ApiError';
import { isAuthorized } from '../../models/User';
import * as db from '../db';

export const getArticle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errorHandler = new ApiError(next);
  try {
    const user = req.user?.email ?? 'anonymous';
    const { filename } = req.params;
    const topic = await db.getArticle(filename);
    if (!topic) {
      return void errorHandler.passToNext({
        status: 404,
        i18nKey: 'topic_not_found',
        logMsg: `(${user}) topic not found: ${filename}`,
      });
    }
    if (topic.restricted && !isAuthorized(req.user)) {
      return void errorHandler.passToNext({
        status: 401,
        i18nKey: 'unauthorized',
        logMsg: `(${user}) unauthorized for restricted topic ${filename}`,
      });
    }
    res.json(topic);
  } catch (error) {
    errorHandler.passToNext({ error, status: 500 });
  }
};
