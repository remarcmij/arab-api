import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../ApiError';
import { isAuthorized } from '../../models/User';
import { ITopic } from '../../models/Topic';
import * as db from '../db';

export const getArticle = (req: Request, res: Response, next: NextFunction) => {
  const errorHandler = new ApiError(next);
  const user = req.user?.email ?? 'anonymous';
  const { filename } = req.params;
  db.getArticle(filename).then((topic: ITopic): void => {
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
  });
};
