// tslint:disable-next-line: no-var-requires
require('dotenv').load();
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import apiRouter from './api';
import authRouter from './auth';
import logger from './config/logger';
import * as content from './content/content';

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

mongoose.connect('mongodb://localhost/arab', { useNewUrlParser: true });
const { connection } = mongoose;
connection.on('error', err => logger.error(`connection error: ${err.message}`));
connection.once('open', () => logger.info('connected to MongoDB'));

const main = async () => {
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
      await content.refreshContent();
      await content.watchContent();
      logger.info(`server started at http://localhost:${PORT}`);
    } catch (err) {
      logger.error(`error stating server: ${err.message}`);
    }
  });
};

main();
