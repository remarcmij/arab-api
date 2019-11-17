import { RequestHandler } from 'express';
import { isAuthorized } from '../../models/User';
import * as db from '../db';
import { withError } from '../ApiError';

export const getSearch: RequestHandler = async (req, res, next) => {
  try {
    const { term } = req.query;
    const lemmas = await db.searchWord(term, isAuthorized(req.user));
    res.json(lemmas);
  } catch (error) {
    withError(next)({ error: error.message, status: 500 });
  }
};
