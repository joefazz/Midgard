import express from "express";
import { createToken } from "./auth";
import passport from "passport";
import bodyParser from "body-parser";
import cors from "cors";
import { User } from "../models/user";
import { Group } from "../models/group";
import { spawn } from "child_process";

const server = new express();

server.use(bodyParser.json());

server.use(cors());

// server.use('/user', passport.authenticate('jwt', { session: false }));

// User signup endpoint
server.post(
    "/signup",
    passport.authenticate("signup", { session: false }),
    async function(req, res, next) {
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
server.post("/login", (req, res, next) => {
    passport.authenticate("login", (err, user, info) => {
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
server.post("/user", (req, res) => {
    const { email } = req.body;

    User.where({ email }).findOne(
        {},
        { hash: false, salt: false },
        {},
        (err, user) => {
            // console.log(err);
            console.log(user);
            if (user === null) {
                res.status(404).send();
            } else {
                res.json(user).send();
            }
        }
    );
});

server.post("/createGroup", async (req, res) => {
    const { name, description, coverImage, ownerID } = req.body;

    if (name && description && coverImage && ownerID) {
        try {
            console.log("here");
            const group = await Group.create({
                name,
                description,
                coverImage
            });

            // Relational stuff goes here

            res.send(group);
        } catch (err) {
            res.status(500).send(err);
        }
    } else {
        res.send(400);
    }
});

server.post("/python", (req, res) => {
    const { code } = req.body;

    console.log(code);
    const thread = spawn;
    const process = thread("python", ["python.py", code]);

    process.stdout.on("data", data => {
        res.send(data.toString());
    });

    process.on("error", err => {
        console.log("error");
        res.send(500);
    });
});

// server.get('/getAdmin', (req, res) => {
//     models.Group.findOne({ where: { id: 7 } })
//         .then((group) => group.getAdmins())
//         .then((admins) => res.send(admins));
// });

export default server;
