const http = require("http");
const app = require("./app");
const env = require("./config/env");
const connectDatabase = require("./config/db");
const { initSocket } = require("./socket/socketServer");
const seedDevelopmentUsers = require("./utils/seedDevelopmentUsers");

async function startServer() {
  await connectDatabase();

  if (env.nodeEnv === "development") {
    await seedDevelopmentUsers();
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`${env.appName} listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
