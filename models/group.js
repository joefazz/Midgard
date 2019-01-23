import mongoose from 'mongoose';
import { Schema } from './user';

const groupSchema = new Schema({
    name: { type: String, unique: true },
    description: String,
    coverImage: String
});

export const Group = mongoose.model('Group', groupSchema);
