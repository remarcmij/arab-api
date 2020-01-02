import { NextFunction, Request, Response } from 'express';
import {
  checkRequiredFields,
  handleRequestErrors,
} from '../../middleware/route-validator';
import { isAuthorized } from '../../models/User';
import { withError } from '../ApiError';
import * as db from '../db';

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
    withError(next)({ error: error.message, status: 500 });
  }
};

getSearch.handlers = [
  checkRequiredFields('term', 'term is required'),
  handleRequestErrors,
  getSearch,
];
