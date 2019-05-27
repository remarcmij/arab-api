import express, { Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator/check';
import { authCheck } from '../auth/auth-service';
import '../auth/local/passport-setup';
import logger from '../config/logger';
import { ITopic } from '../models/Topic';
import { isAuthorizedUser, User } from '../models/User';
import * as db from './db';

const router = express.Router();

const hasRequestErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

router.get('/', authCheck, (req: Request, res: Response) => {
  const isAuthorized = isAuthorizedUser(req.user);
  db.getIndexTopics()
    .then(topics => topics.filter(topic => !topic.restricted || isAuthorized))
    .then(topics => res.json(topics));
});

router.get('/profile', authCheck, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select(
      '-hashedPassword',
    );
    if (!user) {
      return res.sendStatus(401);
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} (${user.status}) signed in`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  '/index/:publication',
  authCheck,
  param('publication', 'publication is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response) => {
    if (hasRequestErrors(req, res)) {
      return;
    }
    const isAuthorized = isAuthorizedUser(req.user);
    db.getArticleTopics(req.params.publication)
      .then(topics => topics.filter(topic => !topic.restricted || isAuthorized))
      .then(topics => res.json(topics));
  },
);

router.get(
  '/article/:filename',
  authCheck,
  param('filename', 'filename is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response) => {
    if (hasRequestErrors(req, res)) {
      return;
    }
    const { filename } = req.params;
    db.getArticle(filename).then(
      (topic: ITopic): void => {
        if (!topic) {
          return void res.sendStatus(404);
        }
        if (topic.restricted && !isAuthorizedUser(req.user)) {
          return void res.sendStatus(401);
        }
        res.json(topic);
      },
    );
  },
);

router.get(
  '/search',
  authCheck,
  query('term', 'term is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response): void => {
    if (hasRequestErrors(req, res)) {
      return;
    }
    const { term } = req.query;
    db.searchWord(term, isAuthorizedUser(req.user))
      .then((lemmas: any[]) => res.json(lemmas))
      .catch(err => res.status(500).json({ error: err.message }));
  },
);

router.get(
  '/lookup',
  query('term', 'term is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response) => {
    if (hasRequestErrors(req, res)) {
      return;
    }
    const { term } = req.query;
    db.lookup(term)
      .then((words: any[]) => res.json({ words, term }))
      .catch(err => res.status(500).json({ error: err.message }));
  },
);

export default router;
