import express = require("express");
import wsExpress = require("express-ws");
// @ts-ignore
import websocketStream = require("websocket-stream/stream");
import { createToken } from "./auth";
import passport = require("passport");
import bodyParser = require("body-parser");
import cors = require("cors");
import { User } from "./models/user";
import {
    attachSocketToContainer,
    startContainer,
    executeCommand
} from "./docker/container_funcs";
import { Request, Response, NextFunction } from "express";
import { MongoError } from "mongodb";

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
    startContainer(ws);

    // @ts-ignore
    ws.on("message", (msg: string) => {
        const { type, data } = JSON.parse(msg);
        console.log("Message Recieved");
        switch (type) {
            case "Container.Stop":
                console.log("Stopping Container");
                // stopContainer(data.id);
                return;
            case "Container.Exec":
                console.log("Executing command");
                executeCommand(ws, data.id, data.lang, data.repl, data.command);
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

    attachSocketToContainer(stream, req.query.id);
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

// server.post("/python", (req: Request, res: Response) => {
//     // const { code } = req.body;

//     // TODO: add code execution for home page

//     res.send(200);
// });

export default server;
