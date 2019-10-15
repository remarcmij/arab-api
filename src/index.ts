// tslint:disable-next-line: no-var-requires
require('dotenv').load();
import compression from 'compression';
import cors from 'cors';
import exitHook from 'exit-hook';
import express from 'express';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import apiRouter from './api';
import * as content from './api/content';
import authRouter from './auth';
import connectDB from './config/db';
import logger from './config/logger';

const PORT = 8080; // default port to listen

const staticOptions = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  // maxAge: '1d',
  // redirect: false,
  setHeaders(res: express.Response) {
    res.set('x-timestamp', Date.now().toString());
  },
};

const clientPath =
  process.env.NODE_ENV === 'production'
    ? '../public'
    : '../../arab-client/build';

const docRoot = path.resolve(__dirname, clientPath);

(async () => {
  await connectDB();
  const app = express();
  app.use(cors());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(docRoot, staticOptions));
  app.use(passport.initialize());

  app.use('/api', apiRouter);
  app.use('/auth', authRouter);

  app
    .route('/*')
    .get((req, res) => res.sendFile('index.html', { root: docRoot }));

  app.listen(PORT, async () => {
    logger.info('---------------------------------------');
    try {
      await content.syncContent();
      content.watchContent();
      logger.info(`server started at http://localhost:${PORT}`);
    } catch (err) {
      logger.error(`error stating server: ${err.message}`);
    }
  });

  exitHook(() => {
    logger.info('Exiting');
  });
})();
