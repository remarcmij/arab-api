import * as db from '../db';
import { isAuthorized } from '../../models/User';
import { RequestHandler } from 'express';
import { withError } from '../ApiError';

export const rootGet: RequestHandler = async (req, res, next) => {
  try {
    const topics = await db.getIndexTopics();
    const userRelatedTopics = topics.filter(
      topic => !topic.restricted || isAuthorized(req.user),
    );
    res.json(userRelatedTopics);
  } catch (error) {
    withError(next)({ error, status: 500 });
  }
};

export const allGet: RequestHandler = async (req, res, next) => {
  try {
    const topics = await db.getAllTopics();
    res.json(topics);
  } catch (error) {
    withError(next)({ error, status: 500 });
  }
};
