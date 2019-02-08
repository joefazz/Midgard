import docker from "./dockerapi";
import _ = require("lodash");
import { getGod } from "../utils/gods";
import { Repl } from "../types";

export async function startBasicContainer(ws: WebSocket) {
    await buildImage("basic");

    const name = getGod();

    const container = await docker.createContainer({
        Image: "basic",
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Cmd: ["/bin/bash"],
        OpenStdin: true,
        StdinOnce: false,
        name
    });

    await container.start();

    container.inspect(function(err: Error, res: any) {
        const message = err
            ? JSON.stringify({ type: "Error", data: err })
            : JSON.stringify({
                  type: "Container.Start",
                  data: { name, info: res }
              });

        ws.send(message);
    });
}

export async function attachSocketToContainer(
    wss: NodeJS.ReadWriteStream,
    id: string
) {
    try {
        let container = docker.getContainer(id);

        container.attach(
            { stream: true, stdout: true, stderr: true, stdin: true },
            function(err: Error, stream) {
                if (err || stream === undefined) {
                    // handleError();
                    return;
                }
                console.log("Stream Connection Established!");
                stream.pipe(wss);
                wss.pipe(stream);
            }
        );
    } catch (err) {
        console.log("error mate", err);
    }
}

// TODO: Implement this
export async function readCode(ws: WebSocket, id: string, file: string) {
    try {
        let attach_opts = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true
        };
        const cmd = ["cat", file];
        const container = docker.getContainer(id);

        container.exec(
            {
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Cmd: cmd
            },
            (err, exec) => {
                if (err) {
                    // handle err
                    console.log(err);
                    return;
                }
                exec.start(attach_opts, (err: any, res: any) => {
                    console.log(err);
                    res.on("data", (chunk: any) => {
                        console.log(chunk.toString());
                        ws.send(
                            JSON.stringify({
                                type: "Code.Read",
                                data: chunk.toString()
                            })
                        );
                    });
                });
            }
        );
    } catch (err) {
        console.log(err);
    }
}

export async function executeCommand(
    ws: WebSocket,
    id: string,
    repl: Repl,
    code: string
) {
    try {
        let attach_opts = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true
        };

        let file = "";

        switch (repl) {
            case Repl.NODE:
                file = "node.js";
                break;
            case Repl.PYTHON:
                file = "python.py";
                break;
            case Repl.C:
                file = "clang.c";
        }

        let cmd = ["bash", "-c"];

        // Without this line the echo will break if the user decides they want to use a string
        code = code.replace(/"/g, `\\"`);

        if (repl === Repl.C) {
            cmd.push(
                `echo "${code}" > ${file} && gcc ${file} && ./a.out && rm a.out`
            );
        } else {
            cmd.push(`echo "${code}" > ${file} && ${repl} ${file}`);
        }

        console.log(cmd);

        let container = docker.getContainer(id);

        container.exec(
            {
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Cmd: cmd
            },
            (err, exec) => {
                exec.start(attach_opts, (err: any, res: any) => {
                    console.log(err);
                    res.on("data", (chunk: any) => {
                        console.log(chunk.toString());
                        ws.send(
                            JSON.stringify({
                                type: "Container.Exec",
                                data: chunk.toString()
                            })
                        );
                    });
                });
            }
        );
    } catch (err) {
        // ws.send(
        //     JSON.stringify({ type: "Container.Exec", data: err.toString() })
        // );
    }
}

export async function stopContainer(id: string) {
    try {
        console.log(id);
        let container = docker.getContainer(id);

        await container.stop();

        await container.remove();

        console.log("SUCCESSFULLY KILLED: " + id);
    } catch (err) {
        console.log(err);
    }
}

export function stopEverything() {
    docker.listContainers(function(err, containers = []) {
        if (err) {
            return;
        }
        containers.forEach(function(containerInfo) {
            docker
                .getContainer(containerInfo.Id)
                .stop(() => console.log("Stopped: " + containerInfo.Id));

            docker
                .getContainer(containerInfo.Id)
                .remove(() => console.log("Removed: " + containerInfo.Id));
        });
    });
}

export async function loadExerciseContainer(ws: WebSocket, exerciseID: number) {
    let imageName = exerciseID === 0 ? "python_basics" : "undef";

    await buildImage(imageName);

    let container = await docker.createContainer({
        Image: imageName,
        AttachStderr: true,
        AttachStdout: true,
        AttachStdin: false,
        Tty: true
    });

    await container.start();

    ws.send(
        JSON.stringify({
            type: "Exercise.Connect",
            data: { id: container.id }
        })
    );
}

// export function pollContainer() {
//     docker.listContainers({ all: true }, (err, containers) => {
//         // io.emit("containers.list", containers);
//     });
// }

async function buildImage(image: string, label?: string) {
    let stream = await docker.buildImage(
        {
            context: __dirname + "/" + image,
            src: ["Dockerfile"]
        },
        { t: label || image }
    );

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err: Error, res: any) => {
            console.log(res);
            return err ? reject(err) : resolve(res);
        });
    });
}
