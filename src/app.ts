import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { config } from "./config.js";
import queryRouter from "./routes/query.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinTechX LLM SQL API",
      version: "1.0.0"
    },
    servers: [{ url: `http://localhost:${config.port}` }]
  },
  apis: ["./src/routes/*.ts"]
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", queryRouter);

app.use(
  (
    err: { message?: string; status?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.status ?? 400;
    res.status(status).json({ error: err.message ?? "Unexpected error" });
  }
);

export default app;
