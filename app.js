const http = require("http");
const Redis = require("ioredis");
const os = require("os");

const hostname = os.hostname();
let views = 0;

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  db: process.env.REDIS_DB || 1,
  port: process.env.REDIS_PORT || 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};
console.error(`Connecting to ${redisConfig.host}:${redisConfig.port}`);

const client = new Redis(redisConfig);

client.on("error", (error) => {
  console.log(error);
  process.exit(1);
});

const requestListener = async function (req, res) {
  try {
    views++;
    const [totalViewCount, containerViewCount] = await Promise.all([
      client.incr("totalViewCount"),
      client.hincrby("containerViewCount", hostname, 1),
    ]);

    const perContainerViewCount = await client.hgetall("containerViewCount");
    res.writeHead(200);
    res.end(`
Simple app status
---
Server hostname: ${hostname}
---
Count in this nodejs application instance runtime : ${views} times
Count for this container: ${containerViewCount} times
Count for all containers: ${totalViewCount} times
---
Container name\t | Visit count${Object.entries(perContainerViewCount)
      .map(([name, count]) => "\n\t" + name + "\t | " + count)
      .join("")}`);
  } catch (err) {
    res.writeHead(200);
    res.end();
  }
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 8080);
