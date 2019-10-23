import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export const enum AuthProvider {
  Local = 'local',
  Google = 'google',
  Facebook = 'facebook',
}

export const enum AuthStatus {
  Registered = 'registered',
  Authorized = 'authorized',
}

declare global {
  namespace Express {
    // tslint:disable-next-line: no-empty-interface interface-name
    interface User {
      id?: any;
      name: string;
      email: string;
      photo?: string;
      hashedPassword?: string;
      provider: AuthProvider;
      status: AuthStatus;
      verified: boolean;
      isAdmin: boolean;
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
  status: { type: String, required: true },
  hashedPassword: { type: String, required: false },
  provider: { type: String, required: true },
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

export default mongoose.model<IUserDocument>('User', userSchema);
