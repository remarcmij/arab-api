import { NextFunction, Request, Response } from 'express';
import User from '../../models/User';
import { withError } from '../ApiError';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nextWithError = withError(next);
  try {
    const users = await User.find({});

    users.forEach(user => {
      delete user.password;
    });

    res.status(200).json(users);
  } catch (error) {
    nextWithError({ status: 400, error });
  }
};
