import { Exercise, IExercise } from "./exercise";

import mongoose = require("mongoose");

export const Schema = mongoose.Schema;

const activitySchema = new Schema({
    title: String,
    description: String,
    container: String,
    length: Number,
    difficulty: String,
    language: String,
    exercises: [{ type: Schema.Types.ObjectId, ref: Exercise.modelName }]
});

export type IActivity = {
    title: string;
    description: string;
    container: string;
    length: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    language: string;
    exercises?: mongoose.Types.ObjectId[];
};

export const Activity = mongoose.model<IActivity & mongoose.Document>(
    "Activity",
    activitySchema
);
