import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator/check';
import multer from 'multer';
import { isAdmin, isAuthenticated, maybeAuthenticated } from '../auth/auth-service';
import '../auth/local/passport-setup';
import logger from '../config/logger';
import { ITopic } from '../models/Topic';
import User, { isAuthorized } from '../models/User';
import {
  getAllContentFiles,
  removeContentAndTopic,
  syncContent,
  validateDocumentName,
  validateDocumentPayload,
} from './content';
import * as db from './db';

import fs from 'fs';
import path from 'path';

const apiRouter = express.Router();
const upload = multer();

const uploadContentDir = path.join(__dirname, '../../content/');

const handleRequestErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(errors.array());
    return true;
  }
  return false;
};

const handleNodeFSErrors = (error: Error) => error.name.startsWith('ERR');

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

apiRouter.post('/upload', isAdmin, upload.single('file'),
  async (req: Request, res: Response) => {
    const data = req.file.buffer.toString('utf8');
    const destination = path.join(uploadContentDir, req.file.originalname);
    try {

      validateDocumentName(req.file);
      validateDocumentPayload(data);

      await fs.promises.writeFile(destination, data);
      await syncContent(uploadContentDir);
      res.sendStatus(200);
    } catch (error) {
      const isFSError = handleNodeFSErrors(error);
      if (isFSError) {
        return res.status(500).json({ error: 'Oops! something went wrong.' });
      }

      res.status(400).json({ error: error.message });
    }
  });

apiRouter.delete('/remove-topic/:filename', isAdmin,
  async (req: Request, res: Response) => {
    try {
      await removeContentAndTopic(req.params.filename);
      res.sendStatus(200);
    } catch (error) {
      const isFSError = handleNodeFSErrors(error);
      if (isFSError) {
        return res.status(500).json({ error: 'Oops! something went wrong.' });
      }

      res.status(400).json({ error: error.message });
    }
  });

apiRouter.get('/sync-content', isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { names: filenames } = await getAllContentFiles();

      await syncContent(uploadContentDir);
      await syncContent();

      res.status(200).json(filenames);
    } catch (error) {
      const isFSError = handleNodeFSErrors(error);
      if (isFSError) {
        return res.status(500).json({ error: 'Oops! something went wrong.' });
      }

      res.status(400).json({ error: error.message });
    }
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
      .then((lemmas: any[]) => res.json(lemmas))
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
      .then((words: any[]) => res.json({ words, term }))
      .catch(err => res.status(500).json({ error: err.message }));
  },
);

apiRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

apiRouter.use((error: ErrorRequestHandler & Error, req: Request, res: Response, next: NextFunction) => {
  // handling any unexpected middleware libraries error.
  res.status(500).json({ error: 'Oops! Something went wrong.' });
});

export default apiRouter;
