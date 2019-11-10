import express, { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator/check';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {
  isAdmin,
  isAuthenticated,
  maybeAuthenticated,
} from '../auth/auth-service';
import '../auth/local/passport-setup';
import logger from '../config/logger';
import { ITopic } from '../models/Topic';
import User, { isAuthorized } from '../models/User';
import { ApiError } from './ApiError';
import {
  removeContentAndTopic,
  syncContent,
  validateDocumentName,
  validateDocumentPayload,
} from './content';
import * as db from './db';

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

apiRouter.post(
  '/upload',
  // isAdmin,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = req.file.buffer.toString('utf8');
    const destination = path.join(uploadContentDir, req.file.originalname);
    try {
      const isDocumentValidName = validateDocumentName(req.file);

      if (!isDocumentValidName) {
        throw new ApiError({
          status: 400,
          i18nKey: 'invalid_upload_filename',
          logMsg: `upload: invalid filename ${req.file.originalname}`,
        });
      }

      validateDocumentPayload(data);

      // todo: replace these two lines with MongoDB request.
      await fs.promises.writeFile(destination, data);
      await syncContent(uploadContentDir);
      res.sendStatus(200);
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError({ status: 400, error }));
      }
    }
  },
);

apiRouter.delete(
  '/topic/:filename',
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await removeContentAndTopic(req.params.filename);
      res.sendStatus(200);
    } catch (error) {
      next(new ApiError({ status: 400, error }));
    }
  },
);

apiRouter.get(
  '/profile',
  isAuthenticated,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findOne({ email: req.user!.email }).select(
        '-hashedPassword',
      );
      if (!user) {
        return next(
          new ApiError({
            status: 401,
            i18nKey: 'something_went_wrong',
          }),
        );
      }
      user.lastAccess = new Date();
      await user.save();
      logger.info(`user ${user.email} signed in`);
      res.json(user);
    } catch (error) {
      next(new ApiError({ status: 500, error }));
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
  (req: Request, res: Response, next: NextFunction) => {
    if (handleRequestErrors(req, res)) {
      return;
    }
    const user = req.user?.email ?? 'anonymous';
    const { filename } = req.params;
    db.getArticle(filename).then((topic: ITopic): void => {
      if (!topic) {
        return next(
          new ApiError({
            status: 404,
            i18nKey: 'topic_not_found',
            logMsg: `(${user}) topic not found: ${filename}`,
          }),
        );
      }
      if (topic.restricted && !isAuthorized(req.user)) {
        return next(
          new ApiError({
            status: 401,
            i18nKey: 'unauthorized',
            logMsg: `(${user}) unauthorized for restricted topic ${filename}`,
          }),
        );
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

// Error Handling!
apiRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

// apiRouter.use(sysErrorsHandler, userErrorsHandler);

export default apiRouter;
