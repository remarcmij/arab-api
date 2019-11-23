import { RequestHandler } from 'express';
import * as db from '../db';
import { withError } from '../ApiError';

export const getLookup: RequestHandler = async (req, res, next) => {
  try {
    const { term } = req.query;
    const words = await db.lookup(term);
    res.json({ words, term });
  } catch (error) {
    withError(next)({ error: error.message, status: 500 });
  }
};
