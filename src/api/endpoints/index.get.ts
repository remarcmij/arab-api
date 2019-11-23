import * as db from '../db';
import { RequestHandler } from 'express';
import { isAuthorized } from '../../models/User';
import { withError } from '../ApiError';

export const getIndex: RequestHandler = async (req, res, next) => {
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
