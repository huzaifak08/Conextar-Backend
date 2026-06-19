import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { sequelize } from "./db/models";
import { generateLiveKitToken, verifyLiveKitConnection } from "./utils/livekit";
import { sendVerificationCodeWithResend } from "./utils/mailer";
import globalRoutes from "./routes";
import { initializeSocketHandler } from "./sockets/socket_handler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date(),
    service: "conextar-backend",
  });
});

app.post(
  "/api/v1/livekit/token",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { identity, roomName } = req.body;
      if (!identity || !roomName) {
        return res.status(400).json({
          error: "Parameters 'identity' and 'roomName' are required.",
        });
      }

      const token = await generateLiveKitToken(identity, roomName);
      return res.status(200).json({ token });
    } catch (error: any) {
      console.error("❌ LiveKit Token Error:", error.message);
      return res
        .status(500)
        .json({ error: "Internal server error issuing token tokens." });
    }
  },
);

app.get("/api/v1/test-email", async (req: Request, res: Response) => {
  const success = await sendVerificationCodeWithResend(
    "huzaifa.uno@gmail.com",
    "123456",
    "registration",
  );

  if (success) {
    res
      .status(200)
      .json({ message: "Check your inbox! Mail sent successfully." });
  } else {
    res.status(500).json({ error: "Email pipeline failed check server logs." });
  }
});

app.use("/api/v1", globalRoutes);

initializeSocketHandler(io);

async function startServer() {
  try {
    console.log("🚀 STARTING CONEXTAR BACKEND ENGINE");

    console.log("🔄 Authenticating secure handshake with AWS RDS Database...");
    await sequelize.authenticate();
    console.log(
      "📡 [DATABASE] -> AWS RDS Database connected successfully via SSL.",
    );

    console.log("🔄 Testing connectivity to LiveKit Signalling Server...");
    const isLiveKitStable = await verifyLiveKitConnection();
    if (isLiveKitStable) {
      console.log(
        `🎙️  [LIVEKIT]  -> Server is responding and stable at: ${process.env.LIVEKIT_URL}`,
      );
    } else {
      console.log(
        "❌ [LIVEKIT]  -> Warning: Pre-flight handshake failed. Tokens may fail to generate.",
      );
    }

    console.log("\n--------------------------------------------------");
    httpServer.listen(PORT, () => {
      console.log(
        `🟢 Conextar server + WebSockets are fully armed on port ${PORT}`,
      );
      console.log("--------------------------------------------------\n");
    });
  } catch (error) {
    console.error("\n❌ Critical engine crash during core server startup:");
    console.error(error);
    process.exit(1);
  }
}

startServer();
// npx sequelize-cli migration:generate --name <NAME>
// npx sequelize-cli db:migrate --name <NAME>
// npx sequelize-cli db:migrate:undo --name <NAME>
