import * as db from '../db';
import { Request, Response, NextFunction } from 'express';
import { isAuthorized } from '../../models/User';
import { ApiError } from '../ApiError';

export const getIndex = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const topics = await db.getArticleTopics(req.params.publication);
    const userRelatedTopics = topics.filter(
      topic => !topic.restricted || isAuthorized(req.user),
    );
    res.json(userRelatedTopics);
  } catch (error) {
    ApiError.passNext(next, { error, status: 500 });
  }
};
