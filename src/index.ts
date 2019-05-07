// tslint:disable-next-line: no-var-requires
require('dotenv').load();
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import * as content from './content/content';
import apiRouter from './routes/apiRouter';
import logger from './util/logger';

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

const main = async () => {
  const app = express();
  app.use(cors());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(docRoot, staticOptions));

  app.use('/api', apiRouter);

  app
    .route('/*')
    .get((req, res) => res.sendFile('index.html', { root: docRoot }));

  app.listen(PORT, async () => {
    try {
      await content.refreshContent();
      await content.watchContent();
      logger.info(`server started at http://localhost:${PORT}`);
    } catch (err) {
      console.error(err);
    }
  });
};

main();
