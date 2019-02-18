import docker from "./dockerapi";
import _ = require("lodash");
import { getGod } from "../utils/gods";
import { Repl } from "../types";
import { getCodeSaveCommand, getCodeExecutionCommand } from "./parse_code";

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

// TODO: Implement this
// export async function readCode(ws: WebSocket, id: string, file: string) {
//     try {
//         let attach_opts = {
//             Tty: true,
//             stream: false,
//             stdout: true,
//             stderr: true
//         };
//         const cmd = ["cat", file];
//         const container = docker.getContainer(id);

//         container.exec(
//             {
//                 AttachStdin: false,
//                 AttachStdout: true,
//                 AttachStderr: true,
//                 Cmd: cmd
//             },
//             (err, exec) => {
//                 if (err) {
//                     // handle err
//                     console.log(err);
//                     return;
//                 }
//                 exec.start(attach_opts, (err: any, res: any) => {
//                     console.log(err);
//                     res.on("data", (chunk: any) => {
//                         console.log(chunk.toString());
//                         ws.send(
//                             JSON.stringify({
//                                 type: "Code.Read",
//                                 data: chunk.toString()
//                             })
//                         );
//                     });
//                 });
//             }
//         );
//     } catch (err) {
//         console.log(err);
//     }
// }

export async function saveCodeToContainer(
    ws: WebSocket,
    id: string,
    filename: string,
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

        const CMD = getCodeSaveCommand(filename, code);

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

export async function attachStreamToExecution(
    wss: NodeJS.ReadWriteStream,
    id: string,
    repl: Repl,
    filename: string
) {
    try {
        const attachOptions = {
            stream: true,
            stdout: true,
            stderr: true,
            stdin: true
        };

        let container = docker.getContainer(id);

        const CMD = getCodeExecutionCommand(Repl.PYTHON, filename);

        container.exec(
            {
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
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
                            return err;
                        }
                        result.pipe(wss);
                        wss.pipe(result);
                    }
                );
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

export async function stopContainer(id: string, shouldRemove: boolean = false) {
    try {
        console.log(id);
        let container = docker.getContainer(id);

        await container.stop();

        if (shouldRemove) {
            await container.remove();
            console.log("SUCCESSFULLY KILLED: " + id);
        } else {
            console.log("SUCCESSFULLY PAUSED: " + id);
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

export async function loadExerciseContainer(ws: WebSocket, exerciseId: number) {
    let imageName = exerciseId === 0 ? "python_basics" : "undef";

    await buildImage(imageName, imageName, ["python.py"]);

    let container = await docker.createContainer({
        Image: imageName,
        AttachStderr: true,
        AttachStdout: true,
        AttachStdin: true,
        Tty: true,
        OpenStdin: true,
        StdinOnce: false
    });

    await container.start();

    console.log("Exercise Container Started: " + imageName);

    ws.send(
        JSON.stringify({
            type: "Exercise.Connect",
            data: { exerciseContainerId: container.id }
        })
    );
}

async function buildImage(
    image: string,
    label?: string,
    otherBuildFiles?: string[]
) {
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

// async function saveCode
