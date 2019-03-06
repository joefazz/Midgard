export enum Language {
    JS = "javascript",
    PYTHON = "python",
    C = "cpp"
}

export enum MessageTypes {
    CONTAINER_START = "Container.Start",
    CONTAINER_EXEC = "Container.Exec",
    CONTAINER_READ = "Container.Read",
    CONTAINER_STOP = "Container.Stop",
    CONTAINER_PAUSED = "Container.Paused",
    EXERCISE_START = "Exercise.Start",
    EXERCISE_CONNECT = "Exercise.Connect",
    EXERCISE_STOP = "Exercise.Stop",
    EXERCISE_RUN = "Exercise.Run",
    EXERCISE_EXEC = "Exercise.Exec",
    CODE_SAVE = "Code.Save"
}
