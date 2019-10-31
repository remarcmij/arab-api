import { Document, model, Schema } from 'mongoose';

// ref https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb

export interface IVerificationToken {
  id?: any;
  _userId: any;
  token: string;
}

const tokenSchema = new Schema({
  _userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now, expires: 43200 },
});

export interface IVerificationTokenDocument
  extends Document,
    IVerificationToken {}

export default model<IVerificationTokenDocument>('Token', tokenSchema);
