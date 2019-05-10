import express, { Request, Response } from 'express';
import { ILemma } from 'Types';
import { hasRole, isAuthenticated } from '../auth/auth-service';
import logger from '../config/logger';
import * as db from '../content/database';
import { User } from '../models/user-model';

const getIndex = (req: Request, res: Response) => {
  db.getIndex().then((rows: any) => res.json(rows));
};

const getChapters = (req: Request, res: Response) => {
  db.getChapters(req.params.publication).then((rows: any) => res.json(rows));
};

const getDocument = (req: Request, res: Response) => {
  const { filename } = req.params;
  db.getDocument(filename).then(
    (doc: any): void => {
      if (!doc) {
        return void res.sendStatus(404);
      }
      res.json(doc);
    },
  );
};

const lookup = (req: Request, res: Response): void => {
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
};

const searchWord = (req: Request, res: Response): void => {
  const { term } = req.query;
  if (!term) {
    return void res
      .status(400)
      .json({ error: 'Empty search term is invalid.' });
  }
  db.searchWord(term).then((lemmas: ILemma[]) => res.json(lemmas));
};

const getProfile = async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.user.email });
  if (!user) {
    return res.sendStatus(401);
  }
  user.lastAccess = new Date();
  await user.save();
  logger.info(`User ${user.email} (${user.role}) signed in`);
  res.json(user);
};

const hasUserOrAdminRole = hasRole(['user', 'admin']);
const hasAdminRole = hasRole('admin');

const router = express.Router();

router
  .get('/', isAuthenticated, getIndex)
  .get('/profile', isAuthenticated, getProfile)
  .get('/index/:publication', hasUserOrAdminRole, getChapters)
  .get('/article/:filename', hasUserOrAdminRole, getDocument)
  .get('/lookup', lookup) // non-sensitive: trade protection for speed
  .get('/search', hasUserOrAdminRole, searchWord);

export default router;
