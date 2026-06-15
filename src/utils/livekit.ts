import { AccessToken, Room, RoomServiceClient } from "livekit-server-sdk";

const getCredentials = () => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    throw new Error(
      "Missing LiveKit configuration credentials inside your environment configuration file.",
    );
  }

  return { apiKey, apiSecret, livekitUrl };
};

/**
 * Pre-flight check to verify if the backend can successfully communicate with the LiveKit server instance.
 */
export const verifyLiveKitConnection = async (): Promise<boolean> => {
  try {
    const { apiKey, apiSecret, livekitUrl } = getCredentials();

    // Instantiate the management client
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    // A quick lightweight API request to list rooms acts as a stability handshake
    await roomService.listRooms();
    return true;
  } catch (error: any) {
    console.error("⚠️ LiveKit Connection Warning:", error.message || error);
    return false;
  }
};

/**
 * Generates a secure streaming token for real-time channels.
 */
export const generateLiveKitToken = async (
  identity: string,
  roomName: string,
): Promise<string> => {
  const { apiKey, apiSecret } = getCredentials();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: identity,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await token.toJwt();
};

export const createLiveKitRoom = async (roomName: string): Promise<Room> => {
  try {
    const { apiKey, apiSecret, livekitUrl } = getCredentials();
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    const roomOptions = {
      name: roomName,
      emptyTimeout: 0,
      maxParticipants: 10,
    };
    const room = await roomService.createRoom(roomOptions);

    console.log(
      `🎙️  [LIVEKIT] -> Secure 10-seat room initialized on host: ${room.name}`,
    );

    return room;
  } catch (error: any) {
    console.error(`❌ LiveKit Room Creation Exception: ${error.message}`);
    throw new Error(
      `Failed to provision LiveKit real-time streaming media room: ${error.message}`,
    );
  }
};
