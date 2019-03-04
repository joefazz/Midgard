import { IExercise } from "../../models/exercise";
import { pythonActivities } from "./activities";

export const PythonActivity: IExercise = {
    title: "Python Strings 101",
    description: "Learn the basics of strings in Python!",
    container: "python_basic",
    entrypoint: "main.py",
    length: pythonActivities.length,
    difficulty: "beginner",
    language: "python",
    activities: []
};
