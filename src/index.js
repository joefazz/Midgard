import app from "./server";
import mongoose from "mongoose";
const PORT = 4000;

// mongoose.connect(
//     "mongodb://localhost/midgard",
//     { useNewUrlParser: true }
// );

function start() {
    app.listen(PORT, () =>
        console.log("Server running on http://localhost:" + PORT)
    );
}

start();
