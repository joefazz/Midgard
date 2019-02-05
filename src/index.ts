import server from "./server";
import { stopEverything } from "./docker/container_funcs";
// import mongoose from "mongoose";
const PORT = 4000;

// mongoose.connect(
//     "mongodb://localhost/midgard",
//     { useNewUrlParser: true }
// );

function start() {
    stopEverything();

    server.listen(PORT, () =>
        console.log("Server running on http://localhost:" + PORT)
    );
}

start();
