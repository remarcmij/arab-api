import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator/check';
import { isAuthenticated, maybeAuthenticated } from '../auth/auth-service';
import '../auth/local/passport-setup';
import logger from '../config/logger';
import { ITopic } from '../models/Topic';
import User, { isAuthorized } from '../models/User';
import * as db from './db';

const apiRouter = express.Router();

const handleRequestErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(errors.array());
    return true;
  }
  return false;
};

/*
 * @oas [get] /api
 * description: Returns a list of publications topics
 */
apiRouter.get('/', maybeAuthenticated, (req: Request, res: Response) => {
  db.getIndexTopics()
    .then(topics =>
      topics.filter(topic => !topic.restricted || isAuthorized(req.user)),
    )
    .then(topics => res.json(topics));
});

apiRouter.get(
  '/profile',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const user = await User.findOne({ email: req.user!.email }).select(
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
  },
);

/* @oas [get] /api/index/{publication}
 * description: Returns a list of article topics
 * parameters:
 *   - (path) publication {string} The publication name
 */
apiRouter.get(
  '/index/:publication',
  maybeAuthenticated,
  check('publication', 'publication is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response) => {
    if (handleRequestErrors(req, res)) {
      return;
    }
    db.getArticleTopics(req.params.publication)
      .then(topics =>
        topics.filter(topic => !topic.restricted || isAuthorized(req.user)),
      )
      .then(topics => res.json(topics));
  },
);

/* @oas [get] /api/article/{filename}
 * description: Returns an article topic
 * parameters:
 *   - (path) filename {string} The article filename
 */
apiRouter.get(
  '/article/:filename',
  maybeAuthenticated,
  check('filename', 'filename is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response) => {
    if (handleRequestErrors(req, res)) {
      return;
    }
    const { filename } = req.params;
    db.getArticle(filename).then((topic: ITopic): void => {
      if (!topic) {
        return void res.sendStatus(404);
      }
      if (topic.restricted && !isAuthorized(req.user)) {
        return void res.sendStatus(401);
      }
      res.json(topic);
    });
  },
);

apiRouter.get(
  '/search',
  maybeAuthenticated,
  check('term', 'term is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response): void => {
    if (handleRequestErrors(req, res)) {
      return;
    }
    const { term } = req.query;
    db.searchWord(term, isAuthorized(req.user))
      .then((lemmas: unknown[]) => res.json(lemmas))
      .catch(err => res.status(500).json({ error: err.message }));
  },
);

apiRouter.get(
  '/lookup',
  check('term', 'term is required')
    .not()
    .isEmpty(),
  (req: Request, res: Response) => {
    if (handleRequestErrors(req, res)) {
      return;
    }
    const { term } = req.query;
    db.lookup(term)
      .then((words: unknown[]) => res.json({ words, term }))
      .catch(err => res.status(500).json({ error: err.message }));
  },
);

apiRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default apiRouter;
