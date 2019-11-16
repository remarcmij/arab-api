import express, { Request, Response } from 'express';
import multer from 'multer';
import {
  isAdmin,
  isAuthenticated,
  maybeAuthenticated,
} from '../auth/auth-service';
import '../auth/local/passport-setup';
import {
  checkRequiredFields,
  handleRequestErrors,
} from './middleware/route-validator';
import {
  getRoot,
  postUpload,
  deleteTopic,
  getProfile,
  getIndex,
  getArticle,
  getSearch,
  getLookup,
} from './endpoints';

const apiRouter = express.Router();
const uploadSingleFile = multer().single('file');

/*
 * @oas [get] /api
 * description: Returns a list of publications topics
 */
apiRouter.get('/', maybeAuthenticated, getRoot);

apiRouter.post('/upload', isAdmin, uploadSingleFile, postUpload);

apiRouter.delete('/topic/:filename', isAdmin, deleteTopic);

apiRouter.get('/profile', isAuthenticated, getProfile);

/* @oas [get] /api/index/{publication}
 * description: Returns a list of article topics
 * parameters:
 *   - (path) publication {string} The publication name
 */
apiRouter.get(
  '/index/:publication',
  maybeAuthenticated,
  checkRequiredFields('publication', 'publication is required'),
  handleRequestErrors,
  getIndex,
);

/* @oas [get] /api/article/{filename}
 * description: Returns an article topic
 * parameters:
 *   - (path) filename {string} The article filename
 */
apiRouter.get(
  '/article/:filename',
  maybeAuthenticated,
  checkRequiredFields('filename', 'filename is required'),
  handleRequestErrors,
  getArticle,
);

apiRouter.get(
  '/search',
  maybeAuthenticated,
  checkRequiredFields('term', 'term is required'),
  handleRequestErrors,
  getSearch,
);

apiRouter.get(
  '/lookup',
  checkRequiredFields('term', 'term is required'),
  handleRequestErrors,
  getLookup,
);

// Error Handling!
apiRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default apiRouter;
