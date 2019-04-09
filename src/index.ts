require('dotenv').load();
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import lessonRoutes from './routes/lessons';
import logger from './util/logger';
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

const docRoot = path.resolve(__dirname, '../public');

const main = async () => {
  const app = express();
  app.use(cors());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(docRoot, staticOptions));

  app.use('/api', lessonRoutes);

  app.route('/*').get((req, res) => res.sendFile('index.html', { root: docRoot }));

  app.listen(PORT, () => {
    content.watchContent();
    logger.info(`server started at http://localhost:${PORT}`);
  });
};

main();
