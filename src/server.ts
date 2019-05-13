import express = require("express");
import wsExpress = require("express-ws");
// @ts-ignore
import websocketStream = require("websocket-stream/stream");
import { createToken } from "./auth";
import passport = require("passport");
import bodyParser = require("body-parser");
import cors = require("cors");
import {
    attachSocketToContainer,
    startBasicContainer,
    executeCommand,
    stopContainer,
    saveCodeToContainer,
    resumeContainer,
    getFileSystem,
    readCode
} from "./docker/container_funcs";
import { Request, Response, NextFunction } from "express";
import { Language } from "./@types";
import {
    loadExerciseContainer,
    attachStreamToExecution
} from "./docker/exercise_funcs";
import { IExercise } from "./models/exercise";
import { IActivity } from "./models/activity";
import { exerciseRef } from ".";
import { convertSnapshotToArray } from "./utils/firebase";

const server = express();

wsExpress(server, undefined, {
    wsOptions: {
        perMessageDeflate: false
    }
});

server.use(bodyParser.json());

server.use(cors());

// server.use('/user', passport.authenticate('jwt', { session: false }));

// User signup endpoint

// @ts-ignore
server.ws("/", (ws: WebSocket) => {
    console.log("Connection Made");
    startBasicContainer(ws);

    // @ts-ignore
    ws.on("message", (msg: string) => {
        const { type, data } = JSON.parse(msg);
        console.log("Message Received: " + type);
        switch (type) {
            case "Container.Pause":
                // Used when focus is lost from tab
                console.log("Pausing container");
                stopContainer(ws, data.id);
                break;
            case "Container.Resume":
                // Used when focus is resumed via tab
                console.log("Resuming container");
                resumeContainer(ws, data.id);
                break;
            case "Container.Stop":
                // Used when trying to stop the container entirely
                console.log("Stopping Container");
                stopContainer(ws, data.id);
                break;
            case "Container.Exec":
                // This is used for the homepage demo window
                console.log("Executing command");
                executeCommand(ws, data.id, data.repl, data.filename);
                break;
            case "Container.TreeRead":
                console.log("Getting fs");
                getFileSystem(ws, data.id);
                break;
            case "Code.Read":
                readCode(ws, data.file, data.id);
                break;
            case "Exercise.Start":
                console.log("loading exercise");
                loadExerciseContainer(ws, data.image);
                break;
            case "Exercise.Stop":
                console.log("Killing exercise");
                console.log(data);
                stopContainer(ws, data.id, true, data.containerId);
                break;
            case "Exercise.Save":
                console.log("Saving exercise code");
                saveCodeToContainer(ws, data.id, data.file, data.code);
            case "Code.Save":
                console.log("Saving code");
                saveCodeToContainer(ws, data.id, data.file, data.code);
                break;
            default:
                console.log("Unknown type", type);
        }
    });

    // @ts-ignore
    ws.on("close", () => {
        console.log("Connection Lost");
    });
});

// @ts-ignore
server.ws("/connect", (ws: WebSocket, req: Request) => {
    const stream = websocketStream(ws, { binary: true });
    console.log("Trying to connect streams");

    attachSocketToContainer(
        stream,
        req.query.id,
        req.query.bidirectional,
        req.query.logs
    );
});

// @ts-ignore
server.ws("/exercise", (ws: WebSocket, req: Request) => {
    const stream = websocketStream(ws, { binary: true });
    const { id, repl, filename } = req.query;
    console.log("Trying to connect exercise stream");

    attachStreamToExecution(stream, id, repl, filename);
});

// server.post(
//     "/signup",
//     passport.authenticate("signup", { session: false }),
//     async function(req: Request, res: Response) {
//         const { email, firstName, lastName, name, tags, age } = req.body;
//         const { salt, hash } = req.user;

//         try {
//             const user = await User.create({
//                 email,
//                 salt,
//                 hash,
//                 firstName,
//                 lastName,
//                 name,
//                 tags,
//                 age
//             });

//             // @ts-ignore
//             // For now
//             const body = { _id: user.id, email: user.email };
//             const token = createToken({ body, maxAge: 3600 });

//             res.status(200);
//             res.json({ message: "Signup Successful", user, token });
//         } catch (error) {
//             res.status(500);
//             res.send(error);
//         }
//     }
// );

// User login endpoint
server.post("/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("login", (err, user) => {
        try {
            if (err || !user) {
                res.statusMessage = "User not found.";
                return res.status(404).send();
            }
            req.login(user, { session: false }, error => {
                if (error) {
                    res.statusMessage = "Password incorrect.";
                    return res.status(401).send();
                }
            });

            const body = { _id: user.id, email: user.email };
            const token = createToken({ body, maxAge: 3600 });

            return res.json({ token, user });
        } catch (error) {
            res.statusMessage = "Server issue logging you in.";
            return res.status(500).send();
        }
    })(req, res, next);
});

// Get user profile endpoint
// server.post("/user", (req: Request, res: Response) => {
//     const { email } = req.body;

//     // @ts-ignore
//     User.where({ email }).findOne(
//         {},
//         { hash: false, salt: false },
//         {},
//         (err: MongoError, user: any) => {
//             // console.log(err);
//             console.log(user);
//             if (err) {
//                 res.status(500).send(err);
//             } else if (user === null) {
//                 res.status(404).send();
//             } else {
//                 res.json(user).send();
//             }
//         }
//     );
// });

server.post("/create", (req: Request, res: Response) => {
    const { activities, title, description, language }: IExercise = req.body;

    console.log(req.body);

    let entrypoint, container;

    switch (language) {
        case Language.JS:
            entrypoint = "index.js";
            container = "js_basics";
            break;
        case Language.C:
            entrypoint = "main.c";
            container = "cpp_basics";
            break;
        case Language.PYTHON:
            entrypoint = "main.py";
            container = "python_basics";
            break;
        default:
    }

    let newExerciseRef = exerciseRef.push({
        title,
        description,
        language,
        container,
        entrypoint,
        slug: title.replace(" ", "-").toLowerCase(),
        difficulty: "beginner",
        length: activities.length,
        activities: activities
    });

    res.json({ id: newExerciseRef.key });
});

server.get("/exercises", (req: Request, res: Response) => {
    exerciseRef.once(
        "value",
        snapshot => {
            res.json(convertSnapshotToArray(snapshot));
        },
        () => res.status(500).send()
    );

    // Exercise.find({}, (err, documents) => {
    //     if (err) {
    //         res.status(500).send(err);
    //     }
    //     res.json(documents);
    // });
});

server.get("/exercise", (req: Request, res: Response) => {
    const { id } = req.query;

    const exercise = exerciseRef.child(id);
    console.log("Retrieving Exercise");

    exercise.once(
        "value",
        snapshot => {
            res.send(snapshot.val());
        },
        () => res.status(500).send()
    );
});

export default server;
