import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { ApiError } from '../ApiError';
import {
  addORReplaceTopic,
  validateDocumentName,
  validateDocumentPayload,
} from '../content';

export const postUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.file.buffer.toString('utf8');
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

    const filename = path.parse(req.file.originalname).name;
    const disposition = await addORReplaceTopic(filename, data);
    res.status(200).json(disposition);
  } catch (error) {
    errorHandler.passToNext({ status: 400, error });
  }
};
