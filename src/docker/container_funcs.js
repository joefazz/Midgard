import docker from "./dockerapi";
import { getGod } from "../utils/gods";
import fs from "fs";

export async function startContainer(ws) {
    let stream = await docker.buildImage(
        {
            context: __dirname + "/basic",
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

    const container = await docker.createContainer({
        Image: "basic",
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Cmd: ["/bin/bash"],
        OpenStdin: true,
        StdinOnce: false
    });

    await container.start();

    container.inspect(function(err, res) {
        ws.send(
            JSON.stringify({
                type: "Container.Start",
                data: { name: name, info: res }
            })
        );
    });
}

export async function attachSocketToContainer(wss, id) {
    try {
        let container = docker.getContainer(id);

        container.attach(
            { stream: true, stdout: true, stderr: true, stdin: true },
            function(err, stream) {
                stream.pipe(wss);
                wss.pipe(stream);
            }
        );
    } catch (err) {
        console.log("error mate", err);
    }
}

export async function stopContainer(ws, id) {
    try {
        console.log(id);
        let container = docker.getContainer(id);

        await container.stop();

        container.remove();

        console.log("SUCCESSFULLY KILLED: " + id);
    } catch (err) {
        console.log(err);
    }
}

export function pollContainer() {
    docker.listContainers({ all: true }, (err, containers) => {
        // io.emit("containers.list", containers);
    });
}
