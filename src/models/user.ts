import mongoose = require("mongoose");

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
    tags: [String]
});

type IUser = {
    name: string;
    email: string;
    firstName: string;
    lastName: string;
    hash: string;
    salt: string;
    tags: string;
};

export const User = mongoose.model<IUser & mongoose.Document>(
    "User",
    userSchema
);
