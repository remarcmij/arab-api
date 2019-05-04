import express, { Request, Response } from 'express';
import * as db from '../content/database';
import { ILemma } from 'Types';

function getIndex(_: Request, res: Response) {
  db.getIndex().then((rows: any) => res.json(rows));
}

function getChapters(req: Request, res: Response) {
  db.getChapters(req.params.publication).then((rows: any) => res.json(rows));
}

function getDocument(req: Request, res: Response) {
  const { filename } = req.params;
  db.getDocument(filename).then(
    (doc: any): void => {
      if (!doc) {
        return void res.sendStatus(404);
      }
      res.json(doc);
    },
  );
}

function lookup(req: Request, res: Response): void {
  const { term } = req.query;
  if (!term) {
    return void res
      .status(400)
      .json({ error: 'Empty search term is invalid.' });
  }
  if (term.length === 0) {
    return void res.json([]);
  }
  db.lookup(term).then((words: any[]) => res.json({ words, term }));
}

function searchWord(req: Request, res: Response): void {
  const { term } = req.query;
  if (!term) {
    return void res
      .status(400)
      .json({ error: 'Empty search term is invalid.' });
  }
  db.searchWord(term).then((lemmas: ILemma[]) => res.json(lemmas));
}

const router = express.Router();

router
  .get('/', getIndex)
  .get('/index/:publication', getChapters)
  .get('/article/:filename', getDocument)
  .get('/lookup', lookup)
  .get('/search', searchWord);

export default router;
