import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import lessonRoutes from './routes/lessons';
import logger from './util/logger';

const PORT = 8080; // default port to listen

(async () => {
  const app = express();
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  app.use('/api/lessons', lessonRoutes);

  app.listen(PORT, () => {
    logger.info(`server started at http://localhost:${PORT}`);
  });
})();
