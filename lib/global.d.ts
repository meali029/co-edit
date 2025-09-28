import { MongooseCache } from 'mongoose';

declare global {
  var mongoose: MongooseCache | undefined;
}

export {};