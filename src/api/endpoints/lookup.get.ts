import { Request, Response, NextFunction } from 'express';
import * as db from '../db';
import { ApiError } from '../ApiError';

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
    ApiError.passNext(next, { error: error.message, status: 500 });
  }
};
