import server from "./server";
import mongoose = require("mongoose");
import { stopEverything } from "./docker/container_funcs";
import { Activity } from "./models/activity";
import { PythonActivity } from "./activities/python/activity";
import { Exercise } from "./models/exercise";
import { pythonExercises } from "./activities/python/exercises";
const PORT = 4000;

mongoose.connect("mongodb://Mongo/midgard", { useNewUrlParser: true });

function start() {
    // stopEverything();
    // let x: mongoose.Types.ObjectId[] = [];
    // pythonExercises.forEach(exercise => {
    //     const id = new mongoose.Types.ObjectId();
    //     x.push(id);
    //     const exerciseDoc = new Exercise({ _id: id, ...exercise });

    //     exerciseDoc.save(function(err) {
    //         console.log(err);
    //     });
    // });

    // console.log(x);

    // let activity = new Activity({
    //     ...PythonActivity,
    //     exercises: x
    // });

    // activity.save(function(err) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //     }
    // });

    server.listen(PORT, () =>
        console.log("Server running on http://localhost:" + PORT)
    );
}

start();
