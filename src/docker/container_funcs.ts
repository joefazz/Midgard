import docker from "./dockerapi";
import _ = require("lodash");
import { getGod } from "../utils/gods";

export async function startContainer(ws: WebSocket) {
    let stream = await docker.buildImage(
        {
            context: __dirname + "/basic",
            src: ["Dockerfile"]
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

export async function executeCommand(
    ws: WebSocket,
    id: string,
    lang: string,
    repl: string,
    command: string
) {
    try {
        const cmd = `echo "${_.escape(
            command
        )}" > ${lang}.${lang};${repl} ${lang}.${lang}`;

        console.log(cmd);

        let container = docker.getContainer(id);

        const execID = await container.exec({
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Cmd: [cmd]
        });

        console.log(
            await docker.getExec(execID).start({ Detach: true, Tty: true })
        );
    } catch (err) {
        console.log("Error executing " + command + " in " + repl, err);
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

// export function pollContainer() {
//     docker.listContainers({ all: true }, (err, containers) => {
//         // io.emit("containers.list", containers);
//     });
// }
