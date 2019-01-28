const server = require("express")();
const app = require("http").Server(server);
const io = require("socket.io")(app, { origins: "*:*" });

import { createToken } from "./auth";
import passport from "passport";
import bodyParser from "body-parser";
import cors from "cors";
import { User } from "../models/user";
import { Group } from "../models/group";
import { spawn } from "child_process";
import docker from "./dockerapi";
import { getGod } from "./utils/gods";
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
    const process = thread("python3", ["python.py", code]);

    process.stdout.on("data", data => {
        console.log(data);
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

server.post("/image", (req, res) => {});

io.on("connection", socket => {
    socket.on("containers.list", () => {
        refreshContainers();
    });

    socket.on("container.start", () => {
        startContainer();
    });

    socket.on("container.stop", id => {
        console.log(id);
        stopContainer(id);
    });
});

async function startContainer() {
    let stream = await docker.buildImage(
        {
            context: __dirname + "/docker/basic",
            src: ["Dockerfile"]
        },
        { t: "basic" }
    );

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
            console.log(res);
            return err ? reject(err) : resolve(res);
        });
    });

    const name = getGod();

    docker
        .createContainer({
            Image: "basic",
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ["/bin/ash"],
            OpenStdin: false,
            StdinOnce: false,
            name: name
        })
        .then(container => {
            container.inspect(function(err, res) {
                io.emit("containers.start", { name: name, info: res });
            });
            container.start();
        });
}

async function stopContainer(id) {
    try {
        let container = docker.getContainer(id);

        await container.stop();

        container.remove();

        console.log("SUCCESSFULLY KILLED: " + id);

        io.emit("container.stop");
    } catch (err) {
        console.log(err);
    }
}

function pollContainer() {
    docker.listContainers({ all: true }, (err, containers) => {
        io.emit("containers.list", containers);
    });
}

export default app;
