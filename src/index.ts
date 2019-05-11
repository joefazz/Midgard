import server from "./server";
import admin = require("firebase-admin");
import { stopEverything } from "./docker/container_funcs";
import { PythonActivity } from "./activities/python/exercise";
import { pythonActivities } from "./activities/python/activities";
const PORT = 4000;

admin.initializeApp({
    credential: admin.credential.cert(require("../asgard-service.json")),
    databaseURL: "https://codexe-asgard.firebaseio.com"
});

let db = admin.database();
export const exerciseRef = db.ref("exercises");

function addData() {
    exerciseRef.push().set({ ...PythonActivity, activities: pythonActivities });

    console.log("setting");
}

function start() {
    // stopEverything();
    // addData();

    server.listen(PORT, () =>
        console.log("Server running on http://localhost:" + PORT)
    );
}

start();
