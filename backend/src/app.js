const compression = require("compression");
const cors = require("cors");
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
if (env.nodeEnv === "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}
app.use(compression());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: `${env.appName} is running.`,
  });
});

app.use(env.apiPrefix, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
