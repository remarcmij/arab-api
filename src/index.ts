// tslint:disable-next-line: no-var-requires
require('dotenv').load();
import compression from 'compression';
import cors from 'cors';
import exitHook from 'exit-hook';
import express from 'express';
import i18next from 'i18next';
import i18middleware from 'i18next-express-middleware';
import FSBackend from 'i18next-node-fs-backend';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import apiRouter from './api';
import authRouter from './auth';
import connectDB from './config/db';
import logger from './config/logger';
import { sysErrorsHandler, userErrorsHandler } from './error-establisher';
import localesRouter from './locales';

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

i18next
  .use(FSBackend)
  .use(i18middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, './locales/{{lng}}/{{ns}}.json'),
      addPath: path.join(__dirname, './locales/{{lng}}/{{ns}}.missing.json'),
    },
    fallbackLng: 'en',
    ns: ['server'],
    defaultNS: 'server',
    preload: ['en'],
    saveMissing: true,
  });

(async () => {
  await connectDB();
  const app = express();
  app.use(cors());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(docRoot, staticOptions));
  app.use(i18middleware.handle(i18next));
  app.use(passport.initialize());

  app.use('/api', apiRouter);
  app.use('/auth', authRouter);
  app.use('/locales', localesRouter);

  if (process.env.NODE_ENV === 'production') {
    app
      .route('/*')
      .get((req, res) => res.sendFile('index.html', { root: docRoot }));
  }

  app.use(sysErrorsHandler, userErrorsHandler);

  app.listen(PORT, async () => {
    logger.info('---------------------------------------');
    logger.info(`server started at http://localhost:${PORT}`);
  });

  exitHook(() => {
    logger.info('Exiting');
  });
})();
