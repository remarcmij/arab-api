import { RequestHandler } from 'express';
import path from 'path';
import { withError } from '../ApiError';
import {
  addORReplaceTopic,
  validateDocumentName,
  validateDocumentPayload,
} from '../content';
import { debouncedRebuildAutoCompletions } from '../db';

export const postUpload: RequestHandler = async (req, res, next) => {
  const data = req.file.buffer.toString('utf8');
  const nextWithError = withError(next);
  try {
    const isDocumentValidName = validateDocumentName(req.file);

    if (!isDocumentValidName) {
      return void nextWithError({
        status: 400,
        i18nKey: 'invalid_upload_filename',
        logMsg: `upload: invalid filename ${req.file.originalname}`,
      });
    }

    validateDocumentPayload(data);

    const filename = path.parse(req.file.originalname).name;
    const disposition = await addORReplaceTopic(filename, data);
    debouncedRebuildAutoCompletions();
    res.status(200).json(disposition);
  } catch (error) {
    nextWithError({ status: 400, error });
  }
};
