// import mongoose = require("mongoose");

// export const Schema = mongoose.Schema;

// const activitySchema = new Schema({
//     title: String,
//     description: String,
//     task: String,
//     expectedResult: String,
//     prebakedCode: String,
//     requiredCode: String,
//     exercise: { type: Schema.Types.ObjectId, ref: "Exercise" }
// });

export type IActivity = {
    title: string;
    description: string;
    task: string;
    expectedResult?: string;
    prebakedCode?: string;
    requiredCode?: string;
};

// export const Activity = mongoose.model<IActivity & mongoose.Document>(
//     "Activity",
//     activitySchema
// );
