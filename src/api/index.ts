import express, { Request, Response } from 'express';
import multer from 'multer';
import '../auth/local/passport-setup';
import { isAdmin, isAuthenticated, maybeAuthenticated } from '../auth/services';
import {
  deleteTopic,
  getAll,
  getArticle,
  getIndex,
  getLookup,
  getProfile,
  getRoot,
  getSearch,
  postUpload,
} from './endpoints';

const apiRouter = express.Router();
const uploadSingleFile = multer().single('file');

/*
 * @oas [get] /api
 * description: Returns a list of publications topics
 */
apiRouter.get('/', maybeAuthenticated, getRoot);

/*
 * @oas [get] /all
 * description: if (admin) Returns a list of all topics.
 */
apiRouter.get('/all', isAdmin, getAll);

/*
 * @oas [post] /upload
 * description: if (admin) allows admins to upload new content as files, Returns a status object: { disposition: 'success' | 'unchanged' }
 * parameters:
 *   - (body) file {FormData} client object.
 */
apiRouter.post('/upload', isAdmin, uploadSingleFile, postUpload);

/*
 * @oas [delete] /topic/{filename}
 * description: if (admin) allows admins to delete certain content, Returns Returns a list of all topics.
 * parameters:
 *   - (path) filename {string} as the content ID.
 */
apiRouter.delete('/topic/:filename', isAdmin, deleteTopic, getAll);

/*
 * @oas [get] /profile
 * description: if (user) allows a user to preview their own profile details.
 */
apiRouter.get('/profile', isAuthenticated, getProfile);

/* @oas [get] /api/index/{publication}
 * description: Returns a list of article topics
 * parameters:
 *   - (path) publication {string} The publication name
 */
apiRouter.get('/index/:publication', maybeAuthenticated, getIndex.handlers);

/* @oas [get] /api/article/{filename}
 * description: Returns an article topic
 * parameters:
 *   - (path) filename {string} The article filename
 */
apiRouter.get('/article/:filename', maybeAuthenticated, getArticle.handlers);

/* @oas [get] /search
 * description: Returns a search result out of a `term` the user required, appropriate for the user's restriction.
 * parameters:
 *   - (body) term {string} to look up into the database.
 */
apiRouter.get('/search', maybeAuthenticated, getSearch.handlers);

/* @oas [get] /lookup
 * description: Returns a list of suggestion words to look into.
 * parameters:
 *   - (body) term {string} to look up into the database.
 */
apiRouter.get('/lookup', getLookup.handlers);

// Error Handling!
apiRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default apiRouter;
