import dotenv from "dotenv";

import express, { Request, Response } from "express";
import cors from "cors";
import { sequelize } from "./db/models";
import { generateLiveKitToken, verifyLiveKitConnection } from "./utils/livekit";
import { sendVerificationCode } from "./utils/mailer";
import globalRoutes from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================================================
// MIDDLEWARES
// ==============================================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================================================================
// CORE ENDPOINTS
// ==============================================================================

// 1. System Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date(),
    service: "conextar-backend",
  });
});

// 2. Real-Time LiveKit Token Endpoint
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

// 3. Email Verification Sandbox Route
app.get("/api/v1/test-email", async (req: Request, res: Response) => {
  const success = await sendVerificationCode(
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

// 4. Global Router Subsystem Mounting Point (Auth endpoints, controllers, etc.)
app.use("/api/v1", globalRoutes);

// ==============================================================================
// SERVER INITIALIZATION & HANDSHAKE
// ==============================================================================
async function startServer() {
  try {
    console.log("🚀 STARTING CONEXTAR BACKEND ENGINE");

    // 1. Verify Encrypted AWS RDS Connection Handshake
    console.log("🔄 Authenticating secure handshake with AWS RDS Database...");
    await sequelize.authenticate();
    console.log(
      "📡 [DATABASE] -> AWS RDS Database connected successfully via SSL.",
    );

    // 2. Verify LiveKit Node Instance Stability
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

    // 3. Kick off Express Listener
    console.log("\n--------------------------------------------------");
    app.listen(PORT, () => {
      console.log(`🟢 Conextar server is fully armed on port ${PORT}`);
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
