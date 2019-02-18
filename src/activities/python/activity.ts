import { IActivity } from "../../models/activity";
import { pythonExercises } from "./exercises";

export const PythonActivity: IActivity = {
    title: "Python Strings 101",
    description: "Learn the basics of strings in Python!",
    container: "python_basic",
    entrypoint: "main.py",
    length: pythonExercises.length,
    difficulty: "beginner",
    language: "python"
};
