import mongoose, { Document, Schema } from 'mongoose';

export type Role = 'guest' | 'user' | 'admin';
export type Provider = 'local' | 'google' | 'facebook';

export interface IUser {
  name: string;
  email: string;
  photo: string;
  role: Role;
  hashedPassword?: string;
  provider: Provider;
  created?: Date;
  lastAccess?: Date;
}
const userSchema = new Schema<IUser>({
  name: String,
  email: String,
  photo: String,
  role: String,
  hashedPassword: String,
  provider: String,
  created: { type: Date, default: Date.now },
  lastAccess: { type: Date, default: Date.now },
});

export interface IUserDocument extends Document, IUser {}

export const User = mongoose.model<IUserDocument>('User', userSchema);
