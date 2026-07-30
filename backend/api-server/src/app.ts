import expressLib, { type Express, type ErrorRequestHandler, type Request, type Response, type NextFunction } from "express";
import corsLib from "cors";
import cookieParserLib from "cookie-parser";
import pinoHttpLib from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

// Cast these CommonJS packages' default exports to their known-correct
// callable shape. Some toolchains that type-check this file (notably
// Vercel's own build step for this monorepo) resolve default imports of
// CommonJS modules without esModuleInterop synthesis, which makes TS see
// them as plain namespace objects instead of the callable functions they
// actually are at runtime — producing bogus "not callable" / "Property
// does not exist" errors that don't reflect the real behavior. These casts
// keep the code correct and type-safe under every toolchain, regardless of
// its esModuleInterop setting.
type Middleware = (req: Request, res: Response, next: NextFunction) => void;
const express = expressLib as unknown as (() => Express) & {
  json: (options?: unknown) => Middleware;
  urlencoded: (options?: unknown) => Middleware;
};
const cors = corsLib as unknown as (options?: unknown) => Middleware;
const cookieParser = cookieParserLib as unknown as (secret?: unknown) => Middleware;
const pinoHttp = pinoHttpLib as unknown as (options: unknown) => Middleware;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
};

app.use(errorHandler);

export default app;
