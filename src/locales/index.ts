import express, { Request, Response } from 'express';
import fs from 'fs';
import i18next from 'i18next';
import middleware from 'i18next-express-middleware';
import path from 'path';

const router = express.Router();

// See: https://github.com/i18next/i18next-express-middleware#add-routes
router.post('/add/:lng:/ns:', middleware.missingKeyHandler(i18next));

router.get('/*', (req: Request, res: Response) => {
  const maxAge = process.env.NODE_ENV === 'production' ? '30 days' : '0';
  const fullPath = path.join(__dirname, '../../locales', req.path);
  if (!fs.existsSync(fullPath)) {
    return void res.sendStatus(404);
  }
  res.sendFile(fullPath, { maxAge });
});

export default router;
