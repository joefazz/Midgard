import { Repl, getCodeExecutionCommand } from "./parse_code";
import docker from "./dockerapi";
import { buildImage } from "./container_funcs";

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

        const CMD = getCodeExecutionCommand(filename, repl);

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

export async function loadExerciseContainer(
    ws: WebSocket,
    image: "python_basics" | "js_basics" | "cpp_basics"
) {
    await buildImage(image, image);

    let container = await docker.createContainer({
        Image: image,
        AttachStderr: true,
        AttachStdout: true,
        AttachStdin: true,
        Tty: true,
        OpenStdin: true,
        StdinOnce: false
    });

    await container.start();

    console.log("Exercise Container Started: " + image);

    ws.send(
        JSON.stringify({
            type: "Exercise.Connect",
            data: container.id
        })
    );
}
