import Docker from "dockerode";

const SOCKET_PATH = "/var/run/docker.sock";

const options = { socketPath: SOCKET_PATH };

module.exports = new Docker(options);
