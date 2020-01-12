import { NextFunction, Request, Response } from 'express';
import {
  checkRequiredFields,
  handleRequestErrors,
} from '../../middleware/route-validator';
import { withError } from '../ApiError';
import * as db from '../db';

export const getLookup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { term } = req.query;
    const words = await db.lookup(term);
    res.json({ words, term });
  } catch (error) {
    withError(next)({ error: error.message, status: 500 });
  }
};

getLookup.handlers = [
  checkRequiredFields('term', 'term is required'),
  handleRequestErrors,
  getLookup,
];
