import { Request, Response } from 'express';
import * as db from '../db';

export const getLookup = (req: Request, res: Response) => {
  const { term } = req.query;
  db.lookup(term)
    .then((words: unknown[]) => res.json({ words, term }))
    .catch(err => res.status(500).json({ error: err.message }));
};
