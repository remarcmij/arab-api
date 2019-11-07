import bcrypt from 'bcryptjs';
import { Document, model, Schema } from 'mongoose';

export const enum AuthStatus {
  Registered = 'registered',
  Authorized = 'authorized',
}

// ref: https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
    interface User {
      id?: unknown;
      name: string;
      email: string;
      photo?: string;
      hashedPassword?: string;
      status: AuthStatus;
      verified?: boolean;
      isAdmin?: boolean;
      created?: Date;
      lastAccess?: Date;
    }
  }
}

export type IUser = Express.User;

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photo: { type: String, required: false },
  status: { type: String, required: true }, // TODO: change to: active: {type: Boolean, default: false} ??
  hashedPassword: { type: String, required: false },
  verified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  lastAccess: { type: Date, default: Date.now },
});

export const encryptPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const validatePassword = (password: string, hashedPassword: string) =>
  bcrypt.compare(password, hashedPassword);

export const isAuthorized = (user?: IUser) =>
  !!user && user.status === AuthStatus.Authorized;

export const isAdmin = (user: IUser) => user.isAdmin;

export interface IUserDocument extends Document, IUser {}

export default model<IUserDocument>('User', userSchema);
