import mongoose from 'mongoose';

export const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
        // validate: [validator.isEmail, 'Please enter a valid email address']
    },
    firstName: String,
    lastName: String,
    hash: String,
    salt: String,
    age: Number,
    tags: [String]
});

export const User = mongoose.model('User', userSchema);
