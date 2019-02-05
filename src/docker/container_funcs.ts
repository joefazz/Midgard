import docker from "./dockerapi";
import _ = require("lodash");
import { getGod } from "../utils/gods";

export async function startContainer(ws: WebSocket) {
    let stream = await docker.buildImage(
        {
            context: __dirname + "/basic",
            src: ["Dockerfile", "node.js"]
        },
        { t: "basic" }
    );

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err: Error, res: any) => {
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
    repl: string,
    code: string
) {
    try {
        let attach_opts = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true
        };

        const file = repl === "node" ? "node.js" : "python.py";

        const cmd = [
            "bash",
            "-c",
            `echo "${code}" > ${file} && ${repl} ${file}`
        ];

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

        container.remove();

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
        });
    });
}

// export function pollContainer() {
//     docker.listContainers({ all: true }, (err, containers) => {
//         // io.emit("containers.list", containers);
//     });
// }
