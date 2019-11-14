import { Request, Response, NextFunction } from 'express';
import { validateDocumentPayload, addORReplaceTopic } from '../content';
import { validateDocumentName } from '../content';
import { ApiError } from '../ApiError';

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

    await addORReplaceTopic(req.file.originalname, data);
    res.sendStatus(200);
  } catch (error) {
    errorHandler.passToNext({ status: 400, error });
  }
};
