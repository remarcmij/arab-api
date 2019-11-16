import * as db from '../db';
import { isAuthorized } from '../../models/User';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../ApiError';

export const getRoot = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const topics = await db.getIndexTopics();
    const userRelatedTopics = topics.filter(
      topic => !topic.restricted || isAuthorized(req.user),
    );
    res.json(userRelatedTopics);
  } catch (error) {
    ApiError.passNext(next, { error, status: 500 });
  }
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const topics = await db.getAllTopics();
    res.json(topics);
  } catch (error) {
    ApiError.passNext(next, { error, status: 500 });
  }
};
