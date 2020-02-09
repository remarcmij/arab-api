import { NextFunction, Request, Response } from 'express';
import {
  checkRequiredFields,
  handleRequestErrors,
} from '../../middleware/route-validator';
import { isAuthorized } from '../../models/User';
import { withError } from '../ApiError';
import * as db from '../db';

export const searchGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const terms = req.query.term.split(' ');

    const [lemmas] = await Promise.all(
      terms.map((term: string) => db.searchWord(term, isAuthorized(req.user))),
    );
    res.json(lemmas);
  } catch (error) {
    withError(next)({ error: error.message, status: 500 });
  }
};

searchGet.handlers = [
  checkRequiredFields('term', 'term is required'),
  handleRequestErrors,
  searchGet,
];
