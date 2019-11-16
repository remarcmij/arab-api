import { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator/check';

export const handleRequestErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }
  next();
};

export const checkRequiredFields = (...args: any) => {
  return check(...args)
    .not()
    .isEmpty();
};
