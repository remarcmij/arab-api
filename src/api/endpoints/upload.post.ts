import { Request, Response, NextFunction } from 'express';
import { validateDocumentPayload } from '../content';
import { validateDocumentName } from '../content';
import { syncContent } from '../content';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../ApiError';

const uploadContentDir = path.join(__dirname, '../../content/');

export const postUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.file.buffer.toString('utf8');
  const destination = path.join(uploadContentDir, req.file.originalname);
  const errorHandler = new ApiError(next);
  try {
    const isDocumentValidName = validateDocumentName(req.file);

    if (!isDocumentValidName) {
      return void errorHandler.passToNext({
        status: 400,
        i18nKey: 'invalid_upload_filename',
        logMsg: `upload: invalid filename ${req.file.originalname}`,
      });
    }

    validateDocumentPayload(data);

    // todo: replace these two lines with MongoDB request.
    await fs.promises.writeFile(destination, data);
    await syncContent(uploadContentDir);
    res.sendStatus(200);
  } catch (error) {
    errorHandler.passToNext({ status: 400, error });
  }
};
