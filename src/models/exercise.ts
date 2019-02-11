import mongoose = require("mongoose");

export const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
    title: String,
    description: String,
    task: String,
    expectedResult: String,
    prebakedCode: String,
    requiredCode: String
});

export type IExercise = {
    title: string;
    description: string;
    task: string;
    expectedResult: string;
    prebakedCode?: string;
    requiredCode?: string;
};

export const Exercise = mongoose.model<IExercise & mongoose.Document>(
    "Exercise",
    exerciseSchema
);
