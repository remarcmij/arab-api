import express, { Request, Response } from 'express';
import * as db from '../content/database';
import { IWord } from '../content/database';

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

function dictLookup(req: Request, res: Response): void {
  const { term, id } = req.query;
  if (!term) {
    return void res.status(400).json({ error: 'Empty search term is invalid.' });
  }
  if (!id) {
    return void res.status(400).json({ error: 'Search id is required.' });
  }
  if (term.length < 2) {
    return void res.json([]);
  }
  db.dictLookup(term).then((words: IWord[]) => res.json({ words, id }));
}

const router = express.Router();

router
  .get('/', getIndex)
  .get('/index/:publication', getChapters)
  .get('/article/:filename', getDocument)
  .get('/dict', dictLookup);

export default router;
