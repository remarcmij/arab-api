import { NextFunction, Request, Response } from 'express';
import {
  checkRequiredFields,
  handleRequestErrors,
} from '../../middleware/route-validator';
import { isAuthorized } from '../../models/User';
import { withError } from '../ApiError';
import * as db from '../db';

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
    withError(next)({ error, status: 500 });
  }
};

getIndex.handlers = [
  checkRequiredFields('publication', 'publication is required'),
  handleRequestErrors,
  getIndex,
];
