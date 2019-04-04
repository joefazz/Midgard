import docker from "./dockerapi";
import { getGod } from "../utils/gods";
import {
    getCodeSaveCommand,
    getCodeExecutionCommand,
    Repl
} from "./parse_code";

export async function startBasicContainer(ws: WebSocket) {
    await buildImage("basic", "basic", ["node.js", "main.c", "python.py"]);

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

export async function saveCodeToContainer(
    ws: WebSocket,
    id: string,
    file: string,
    code: string
) {
    try {
        const attachOptions = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true,
            stdin: true
        };

        let container = docker.getContainer(id);

        const CMD = getCodeSaveCommand(file, code);

        container.exec(
            {
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                OpenStdin: false,
                StdinOnce: false,
                Cmd: CMD
            },
            (err, exec) => {
                if (err) {
                    console.log(err);
                    return err;
                }

                exec.start(
                    attachOptions,
                    (err: Error, result: NodeJS.ReadWriteStream) => {
                        if (err) {
                            console.log(err);
                            ws.send(
                                JSON.stringify({
                                    type: "Code.Save",
                                    data: { success: false, error: err }
                                })
                            );
                            return err;
                        }
                        ws.send(
                            JSON.stringify({
                                type: "Code.Save",
                                data: { success: true }
                            })
                        );
                    }
                );
            }
        );
    } catch (err) {
        console.log(err);
    }
}

export async function attachSocketToContainer(
    wss: NodeJS.ReadWriteStream,
    id: string,
    isBidirectional: boolean = true,
    showLogs: boolean
) {
    try {
        let container = docker.getContainer(id);

        console.log("Container ID: " + id, "Bidirectional: " + isBidirectional);

        container.attach(
            {
                stream: true,
                stdout: true,
                stderr: true,
                stdin: isBidirectional,
                logs: showLogs
            },
            function(err: Error, stream) {
                if (err || stream === undefined) {
                    // handleError();
                    return;
                }
                console.log("Stream Connection Established!");
                if (isBidirectional) {
                    stream.pipe(wss);
                    wss.pipe(stream);
                } else {
                    stream.pipe(wss);
                }
            }
        );
    } catch (err) {
        console.log("error mate", err);
    }
}

export async function executeCommand(
    ws: WebSocket,
    id: string,
    repl: Repl,
    filename: string
) {
    try {
        let attach_opts = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true,
            stdin: true
        };

        const cmd = getCodeExecutionCommand(repl, filename);

        let container = docker.getContainer(id);

        container.exec(
            {
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                OpenStdin: true,
                StdinOnce: false,
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

export async function resumeContainer(ws: WebSocket, id: string) {
    try {
        let container = docker.getContainer(id);

        await container.unpause();

        console.log("SUCCESSFULLY UNPAUSED: " + id);
        ws.send(JSON.stringify({ type: "Container.Resume", data: {} }));
    } catch (err) {
        console.log(err);
    }
}

export async function stopContainer(
    ws: WebSocket,
    id: string,
    shouldRemove: boolean = false,
    containerToRestart?: string
) {
    try {
        console.log("Stopping container: " + id);
        let container = docker.getContainer(id);

        if (containerToRestart) {
            let restart = docker.getContainer(containerToRestart);

            restart.unpause();

            ws.send(JSON.stringify({ type: "Container.Resume" }));
        }

        if (shouldRemove) {
            ws.send(JSON.stringify({ type: "Exercise.Stop" }));
            await container.stop();
            await container.remove();
            console.log("SUCCESSFULLY KILLED: " + id);
        } else {
            await container.pause();
            console.log("SUCCESSFULLY PAUSED: " + id);
            ws.send(JSON.stringify({ type: "Container.Pause" }));
        }
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

export async function buildImage(
    image: string,
    label?: string,
    otherBuildFiles?: string[]
) {
    console.log("build image please");
    let stream = await docker.buildImage(
        {
            context: __dirname + "/" + image,
            src: otherBuildFiles
                ? ["Dockerfile", ...otherBuildFiles]
                : ["Dockerfile"]
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

export async function readCode(
    ws: WebSocket,
    file: string,
    containerId: string
) {
    try {
        const attachOptions = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true,
            stdin: false
        };

        let container = docker.getContainer(containerId);

        console.log(file);

        container.exec(
            {
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                OpenStdin: false,
                StdinOnce: false,
                Cmd: ["cat", file]
            },
            (err, exec) => {
                if (err) {
                    console.log(err);
                    return err;
                }

                exec.start(
                    attachOptions,
                    (err: Error, result: NodeJS.ReadWriteStream) => {
                        if (err) {
                            console.log(err);
                            ws.send(
                                JSON.stringify({
                                    type: "Code.Read",
                                    data: { success: false, error: err }
                                })
                            );
                            return err;
                        }
                        result.on("data", chunk => {
                            ws.send(
                                JSON.stringify({
                                    type: "Code.Read",
                                    data: { code: chunk.toString() }
                                })
                            );
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.log(err);
    }
}

export async function getFileSystem(ws: WebSocket, containerId: string) {
    try {
        const attachOptions = {
            Tty: true,
            stream: false,
            stdout: true,
            stderr: true,
            stdin: false
        };

        let container = docker.getContainer(containerId);

        container.exec(
            {
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                OpenStdin: false,
                StdinOnce: false,
                Cmd: ["ls"]
            },
            (err, exec) => {
                if (err) {
                    console.log(err);
                    return err;
                }

                exec.start(
                    attachOptions,
                    (err: Error, result: NodeJS.ReadWriteStream) => {
                        if (err) {
                            console.log(err);
                            ws.send(
                                JSON.stringify({
                                    type: "Container.TreeRead",
                                    data: { success: false, error: err }
                                })
                            );
                            return err;
                        }
                        result.on("data", chunk => {
                            const files = chunk
                                .toString()
                                .split("\n")
                                .filter((element: string) => element !== "");

                            ws.send(
                                JSON.stringify({
                                    type: "Container.TreeRead",
                                    data: { result: files }
                                })
                            );
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.log(err);
    }
}
