import express = require("express");
import wsExpress = require("express-ws");
// @ts-ignore
import websocketStream = require("websocket-stream/stream");
import { createToken } from "./auth";
import passport = require("passport");
import bodyParser = require("body-parser");
import cors = require("cors");
import mongoose = require("mongoose");
import { User } from "./models/user";
import {
    attachSocketToContainer,
    startBasicContainer,
    executeCommand,
    loadExerciseContainer,
    stopContainer,
    attachStreamToExecution,
    saveCodeToContainer,
    resumeContainer,
    getAllStats
} from "./docker/container_funcs";
import { Request, Response, NextFunction } from "express";
import { MongoError } from "mongodb";
import { Exercise, IExercise } from "./models/exercise";
import { Activity, IActivity } from "./models/activity";
import { Language } from "./@types";

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
        console.log("Message Recieved: " + type);
        switch (type) {
            case "Container.Pause":
                console.log("Pausing container");
                stopContainer(ws, data.id);
                break;
            case "Container.Resume":
                console.log("Resuming container");
                resumeContainer(ws, data.id);
                break;
            case "Container.Stop":
                console.log("Stopping Container");
                stopContainer(ws, data.id);
                break;
            case "Container.Exec":
                console.log("Executing command");
                executeCommand(ws, data.id, data.repl, data.filename);
                break;
            case "Code.Read":
                // readCode(ws, data.id, data.file);
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
            case "Code.Save":
                console.log("Saving code");
                saveCodeToContainer(ws, data.id, data.filename, data.code);
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

server.post(
    "/signup",
    passport.authenticate("signup", { session: false }),
    async function(req: Request, res: Response) {
        const { email, firstName, lastName, name, tags, age } = req.body;
        const { salt, hash } = req.user;

        try {
            const user = await User.create({
                email,
                salt,
                hash,
                firstName,
                lastName,
                name,
                tags,
                age
            });

            // @ts-ignore
            // For now
            const body = { _id: user.id, email: user.email };
            const token = createToken({ body, maxAge: 3600 });

            res.status(200);
            res.json({ message: "Signup Successful", user, token });
        } catch (error) {
            res.status(500);
            res.send(error);
        }
    }
);

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
server.post("/user", (req: Request, res: Response) => {
    const { email } = req.body;

    // @ts-ignore
    User.where({ email }).findOne(
        {},
        { hash: false, salt: false },
        {},
        (err: MongoError, user: any) => {
            // console.log(err);
            console.log(user);
            if (err) {
                res.status(500).send(err);
            } else if (user === null) {
                res.status(404).send();
            } else {
                res.json(user).send();
            }
        }
    );
});

server.post("/create", (req: Request, res: Response) => {
    const { activities, title, description, language }: IExercise = req.body;

    console.log(req.body);
    const acts = activities as IActivity[];

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

    let activityIds: mongoose.Types.ObjectId[] = [];
    acts.forEach(activity => {
        const id = new mongoose.Types.ObjectId();
        activityIds.push(id);
        const activityDoc = new Activity({ _id: id, ...activity });

        activityDoc.save(function(err) {
            console.log(err);
        });
    });

    const exerciseID = new mongoose.Types.ObjectId();
    let exercise = new Exercise({
        _id: exerciseID,
        title,
        description,
        language,
        container,
        entrypoint,
        difficulty: "beginner",
        length: activities.length,
        activities: activityIds
    });

    exercise.save(function(err) {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            res.send({ id: exerciseID });
        }
    });
});

server.get("/exercises", (req: Request, res: Response) => {
    Exercise.find({}, (err, documents) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json(documents);
    });
});

server.get("/exercise", (req: Request, res: Response) => {
    const { id } = req.query;

    console.log("Retrieving Exercise");
    Exercise.findById(id)
        .populate("activities")
        .exec()
        .then(exercise => {
            console.log("what is going on?", exercise);
            if (exercise) {
                res.send(exercise);
                return;
            }
            res.sendStatus(404);
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

server.get("/containers", (req: Request, res: Response) => {
    console.log("Getting stats");

    getAllStats()
        .then(stats => res.json(stats))
        .catch(err => res.sendStatus(500));
});

export default server;
