import { NextFunction, Request, Response } from 'express';
import {
  checkRequiredFields,
  handleRequestErrors,
} from '../../middleware/route-validator';
import { isAuthorized } from '../../models/User';
import { withError } from '../ApiError';
import * as db from '../db';

export const getArticle = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nextWithError = withError(next);
  try {
    const user = req.user?.email ?? 'anonymous';
    const { filename } = req.params;
    const topic = await db.getArticle(filename);
    if (!topic) {
      return nextWithError({
        status: 404,
        i18nKey: 'topic_not_found',
        logMsg: `(${user}) topic not found: ${filename}`,
      });
    }
    if (topic.restricted && !isAuthorized(req.user)) {
      return nextWithError({
        status: 401,
        i18nKey: 'unauthorized',
        logMsg: `(${user}) unauthorized for restricted topic ${filename}`,
      });
    }
    res.json(topic);
  } catch (error) {
    nextWithError({ error, status: 500 });
  }
};

getArticle.handlers = [
  checkRequiredFields('filename', 'filename is required'),
  handleRequestErrors,
  getArticle,
];
