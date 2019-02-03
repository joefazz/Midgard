import Docker = require("dockerode");

const SOCKET_PATH = "/var/run/docker.sock";

const options = { socketPath: SOCKET_PATH };

export default new Docker(options);
