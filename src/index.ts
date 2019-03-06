import server from "./server";
import mongoose = require("mongoose");
import { stopEverything } from "./docker/container_funcs";
import { Exercise } from "./models/exercise";
import { PythonActivity } from "./activities/python/exercise";
import { Activity } from "./models/activity";
import { pythonActivities } from "./activities/python/activities";
const PORT = 4000;

mongoose.connect("mongodb://Mongo/midgard", { useNewUrlParser: true });

function addData() {
    let x: mongoose.Types.ObjectId[] = [];
    pythonActivities.forEach(activity => {
        const id = new mongoose.Types.ObjectId();
        x.push(id);
        const activityDoc = new Activity({ _id: id, ...activity });

        activityDoc.save(function(err) {
            console.log(err);
        });
    });

    console.log(x);

    let exercise = new Exercise({
        ...PythonActivity,
        activities: x
    });

    exercise.save(function(err) {
        if (err) {
            console.log(err);
        } else {
        }
    });
}

function start() {
    // stopEverything();
    // addData();

    server.listen(PORT, () =>
        console.log("Server running on http://localhost:" + PORT)
    );
}

start();
