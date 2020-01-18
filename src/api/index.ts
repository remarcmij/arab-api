import express, { Request, Response } from 'express';
import multer from 'multer';
import '../auth/local/passport-setup';
import { isAdmin, isAuthenticated, maybeAuthenticated } from '../auth/services';
import {
  topicDelete,
  userDelete,
  allGet,
  allUsersGet,
  articleGet,
  indexGet,
  lookupGet,
  profileGet,
  rootGet,
  searchGet,
  uploadPost,
  authorizeUserPatch,
} from './endpoints';

const apiRouter = express.Router();
const uploadSingleFile = multer().single('file');

/*
 * @oas [get] /api
 * description: Returns a list of publications topics
 */
apiRouter.get('/', maybeAuthenticated, rootGet);

/*
 * @oas [get] /all
 * description: if (admin) Returns a list of all topics.
 */
apiRouter.get('/all', isAdmin, allGet);

/*
 * @oas [post] /upload
 * description: if (admin) allows admins to upload new content as files, Returns a status object: { disposition: 'success' | 'unchanged' }
 * parameters:
 *   - (body) file {FormData} client object.
 */
apiRouter.post('/upload', isAdmin, uploadSingleFile, uploadPost);

/*
 * @oas [delete] /topic/{filename}
 * description: if (admin) allows admins to delete certain content, Returns Returns a list of all topics.
 * parameters:
 *   - (path) filename {string} as the content ID.
 */
apiRouter.delete('/topic/:filename', isAdmin, topicDelete, allGet);

/*
 * @oas [get] /profile
 * description: if (user) allows a user to preview their own profile details.
 */
apiRouter.get('/profile', isAuthenticated, profileGet);

/* @oas [get] /api/index/{publication}
 * description: Returns a list of article topics
 * parameters:
 *   - (path) publication {string} The publication name
 */
apiRouter.get('/index/:publication', maybeAuthenticated, indexGet.handlers);

/* @oas [get] /api/article/{filename}
 * description: Returns an article topic
 * parameters:
 *   - (path) filename {string} The article filename
 */
apiRouter.get('/article/:filename', maybeAuthenticated, articleGet.handlers);

/* @oas [get] /search
 * description: Returns a search result out of a `term` the user required, appropriate for the user's restriction.
 * parameters:
 *   - (body) term {string} to look up into the database.
 */
apiRouter.get('/search', maybeAuthenticated, searchGet.handlers);

/* @oas [get] /lookup
 * description: Returns a list of suggestion words to look into.
 * parameters:
 *   - (body) term {string} to look up into the database.
 */
apiRouter.get('/lookup', lookupGet.handlers);

/* @oas [patch] /user/authorize
 * description: if (admin) allows admins to authorize users for restricted content, Returns the requested user Object.
 * parameters:
 *   - (body) {email: string; authorize: boolean} as an `id` to update.
 */
apiRouter.patch('/user/authorize', isAdmin, authorizeUserPatch.handlers);

/* @oas [delete] /user
 * description: if (admin) allow admins to remove user specified with his email address.
 * parameters:
 *   - (body) {email: string} as an `id` to remove.
 */
apiRouter.delete('/user', isAdmin, userDelete.handlers);

/* @oas [get] /users/all
 * description: if (admin) allow admins to list all users.
 */
apiRouter.get('/users/all', isAdmin, allUsersGet);

// Error Handling!
apiRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default apiRouter;
