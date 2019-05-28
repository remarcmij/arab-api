import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

type Status = 'visitor' | 'registered' | 'user';
export type Provider = 'local' | 'google' | 'facebook';

export interface IUser {
  name: string;
  email: string;
  photo: string;
  status: Status;
  hashedPassword?: string;
  provider: Provider;
  verified: boolean;
  isAdmin: boolean;
  created?: Date;
  lastAccess?: Date;
}

const UserSchema = new Schema<IUser>({
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

const makeSalt = () => bcrypt.genSalt(10);

export const encryptPassword = async (password: string) => {
  const salt = await makeSalt();
  return bcrypt.hash(password, salt);
};

export const validatePassword = (password: string, hashedPassword: string) =>
  bcrypt.compare(password, hashedPassword);

export interface IUserDocument extends Document, IUser {}

export const User = mongoose.model<IUserDocument>('User', UserSchema);

export const isAuthorizedUser = (user: IUser) => user.status === 'user';

export const isAdmin = (user: IUser) => user.isAdmin;
