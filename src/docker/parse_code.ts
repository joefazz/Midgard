import { Language } from "../@types";

export enum Repl {
    PYTHON = "python",
    JS = "node",
    C = "gcc"
}

export function getCodeSaveCommand(filename: string, code: string) {
    let cmd = ["/bin/bash", "-c"];

    // Without this line the echo will break if the user decides they want to use a string
    code = code.replace(/"/g, `\\"`);
    code = code.replace(/`/g, "\\`");

    cmd.push(`echo "${code}" > ${filename}`);

    return cmd;
}

// FIXME: this doesn't work but maybe it could?
export function getCodeSaveAndRunCommand(
    filename: string,
    code: string,
    repl: Repl
) {
    let command = ["/bin/bash", "-c"];

    code = code.replace(/"/g, `\\"`);
    code = code.replace(/`/g, "\\`");

    command.push(`echo "${code}" > ${filename}`);

    if (repl === Repl.C) {
        return command.concat(`&& gcc ${filename} && ./a.out && rm a.out`);
    } else {
        return command.concat(`&& ${repl} ${filename}`);
    }
}

export function getCodeExecutionCommand(repl: Repl, file: string) {
    let command = ["/bin/bash", "-c"];

    if (repl === Repl.C) {
        return command.concat(`gcc ${file} && ./a.out && rm a.out`);
    } else {
        return command.concat(`${repl} ${file}`);
    }
}
