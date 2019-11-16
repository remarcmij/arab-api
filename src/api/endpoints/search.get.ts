import { Request, Response, NextFunction } from 'express';
import { isAuthorized } from '../../models/User';
import * as db from '../db';
import { ApiError } from '../ApiError';

export const getSearch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { term } = req.query;
    const lemmas = await db.searchWord(term, isAuthorized(req.user));
    res.json(lemmas);
  } catch (error) {
    ApiError.passNext(next, { error: error.message, status: 500 });
  }
};
