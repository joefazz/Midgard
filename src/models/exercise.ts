import { IActivity } from "./activity";

// import mongoose = require("mongoose");

// export const Schema = mongoose.Schema;

// const exerciseSchema = new Schema({
//     title: String,
//     description: String,
//     container: String,
//     entrypoint: String,
//     length: Number,
//     difficulty: String,
//     language: String,
//     activities: [{ type: Schema.Types.ObjectId, ref: Activity.modelName }]
// });

export type IExercise = {
    title: string;
    description: string;
    container: string;
    length: number;
    slug: string;
    entrypoint: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    language: string;
    activities: IActivity[];
};

// export const Exercise = mongoose.model<IExercise & mongoose.Document>(
//     "Exercise",
//     exerciseSchema
// );
