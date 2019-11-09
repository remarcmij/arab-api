import bcrypt from 'bcryptjs';
import { Document, model, Schema } from 'mongoose';

// ref: https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
    interface User {
      id?: any;
      name: string;
      email: string;
      photo?: string;
      password?: string;
      verified?: boolean;
      authorized?: boolean;
      admin?: boolean;
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
  password: { type: String, required: false },
  verified: { type: Boolean, default: false },
  authorized: { type: Boolean, default: false },
  admin: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  lastAccess: { type: Date, default: Date.now },
});

export const encryptPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const validatePassword = (password: string, hashedPassword: string) =>
  bcrypt.compare(password, hashedPassword);

export const isAuthorized = (user?: IUser) => !!user?.authorized;

export const isAdmin = (user: IUser) => user.admin;

export interface IUserDocument extends Document, IUser {}

export default model<IUserDocument>('User', userSchema);
