import { Request, Response } from 'express';
import { isAuthorized } from '../../models/User';
import * as db from '../db';

export const getSearch = (req: Request, res: Response): void => {
  const { term } = req.query;
  db.searchWord(term, isAuthorized(req.user))
    .then((lemmas: unknown[]) => res.json(lemmas))
    .catch(err => res.status(500).json({ error: err.message }));
};
