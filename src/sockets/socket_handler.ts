import { Server, Socket } from "socket.io";
import { User } from "../db/models";
import { generateLiveKitToken } from "../utils/livekit";

interface UserPayload {
  id: string;
  name: string;
  profilePic: string | null;
}

interface ActiveLoungeState {
  waitingArea: UserPayload[]; // 🛋️ Passive listeners (Audience)
  sofas: Array<{ sofaIndex: number; user: UserPayload | null }>; // 🎙️ Active callers (On Stage)
}

const activeRoundtables: Record<string, ActiveLoungeState> = {};

export const initializeSocketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    let currentRoundtableId: string | null = null;
    let currentUserId: string | null = null;

    // 🚀 1. User enters the Roundtable view screen (Joins as Spectator/Waiting Area)
    socket.on(
      "enter_roundtable",
      async (data: { roundtableId: string; userId: string }) => {
        try {
          const { roundtableId, userId } = data;
          currentRoundtableId = roundtableId;
          currentUserId = userId;

          socket.join(roundtableId);

          if (!activeRoundtables[roundtableId]) {
            activeRoundtables[roundtableId] = {
              waitingArea: [],
              sofas: Array.from({ length: 10 }, (_, i) => ({
                sofaIndex: i,
                user: null,
              })),
            };
          }

          const lounge = activeRoundtables[roundtableId];

          // Check if they are already sitting on a sofa or already in the waiting area
          const isAlreadyOnSofa = lounge.sofas.some(
            (s) => s.user?.id === userId,
          );
          const isAlreadyInWaiting = lounge.waitingArea.some(
            (u) => u.id === userId,
          );

          // 🎯 By default, entering the room puts them in the waiting area ONLY if they aren't already active on a sofa
          if (!isAlreadyOnSofa && !isAlreadyInWaiting) {
            const userRecord = await User.findByPk(userId, {
              attributes: ["id", "name", "profilePic"],
            });

            if (userRecord) {
              lounge.waitingArea.push({
                id: userRecord.id,
                name: userRecord.name,
                profilePic: userRecord.profilePic,
              });
            }
          }

          io.to(roundtableId).emit("roundtable_state_changed", lounge);
        } catch (error: any) {
          socket.emit("system_error", { message: error.message });
        }
      },
    );

    // 🚀 2. User clicks a sofa to join the room call (Moves from Waiting -> Sofa)
    socket.on(
      "claim_sofa",
      async (data: {
        roundtableId: string;
        userId: string;
        sofaIndex: number;
      }) => {
        try {
          const { roundtableId, userId, sofaIndex } = data;
          const lounge = activeRoundtables[roundtableId];

          if (!lounge)
            return socket.emit("system_error", {
              message: "Roundtable session not initialized.",
            });
          if (sofaIndex < 0 || sofaIndex > 9)
            return socket.emit("system_error", {
              message: "Invalid sofa index.",
            });

          if (lounge.sofas[sofaIndex].user !== null) {
            return socket.emit("sofa_claim_rejected", {
              message: "This sofa slot is already occupied.",
            });
          }

          // Find user payload data from the waiting area list
          let userPayload = lounge.waitingArea.find((u) => u.id === userId);

          if (!userPayload) {
            const userRecord = await User.findByPk(userId, {
              attributes: ["id", "name", "profilePic"],
            });
            if (userRecord) {
              userPayload = {
                id: userRecord.id,
                name: userRecord.name,
                profilePic: userRecord.profilePic,
              };
            }
          }

          if (!userPayload) {
            return socket.emit("system_error", {
              message: "Could not map user parameters.",
            });
          }

          // Clean up any old seats they were holding just in case
          lounge.sofas.forEach((s) => {
            if (s.user?.id === userId) s.user = null;
          });

          // 🛑 MUTUALLY EXCLUSIVE RULE: Pull them completely OUT of the waiting area array list
          lounge.waitingArea = lounge.waitingArea.filter(
            (u) => u.id !== userId,
          );

          // Snap their identity directly onto the sofa index grid
          lounge.sofas[sofaIndex].user = userPayload;

          // Secure the real LiveKit call access token for the media handler connection
          const liveKitToken = await generateLiveKitToken(
            userPayload.id,
            roundtableId,
          );

          // 📞 Send the success event + token back directly to the claiming user
          socket.emit("sofa_claim_success", { sofaIndex, token: liveKitToken });

          // Broadcast the absolute updated state to update everyone's screen
          io.to(roundtableId).emit("roundtable_state_changed", lounge);
        } catch (error: any) {
          socket.emit("system_error", { message: error.message });
        }
      },
    );

    // 🚀 3. User HANGS UP / Leaves the sofa (Moves from Sofa -> Back to Waiting Area)
    socket.on(
      "leave_sofa",
      (data: { roundtableId: string; userId: string }) => {
        const { roundtableId, userId } = data;
        const lounge = activeRoundtables[roundtableId];

        if (lounge) {
          let userPayload: UserPayload | null = null;

          // Vacate the sofa slot and grab the user's details payload
          lounge.sofas.forEach((s) => {
            if (s.user?.id === userId) {
              userPayload = s.user;
              s.user = null;
            }
          });

          // 🎯 RETURN TO WAITING: If they successfully left a sofa, drop them right back into the horizontal waiting list
          if (userPayload && !lounge.waitingArea.some((u) => u.id === userId)) {
            lounge.waitingArea.push(userPayload);
          }

          // Tell the user client that they have successfully hung up the line
          socket.emit("sofa_left_success");

          // Broadcast the state update so the avatar moves back to the top bar across all client devices
          io.to(roundtableId).emit("roundtable_state_changed", lounge);
        }
      },
    );

    // 🧼 Cleanup automation routine for screen pops or hard dropouts
    const handleLeaveWaitingArea = () => {
      if (currentRoundtableId && currentUserId) {
        const lounge = activeRoundtables[currentRoundtableId];
        if (lounge) {
          lounge.waitingArea = lounge.waitingArea.filter(
            (u) => u.id !== currentUserId,
          );

          lounge.sofas.forEach((s) => {
            if (s.user?.id === currentUserId) s.user = null;
          });

          if (
            lounge.waitingArea.length === 0 &&
            lounge.sofas.every((s) => s.user === null)
          ) {
            delete activeRoundtables[currentRoundtableId];
          } else {
            io.to(currentRoundtableId).emit("roundtable_state_changed", lounge);
          }
        }
      }
    };

    socket.on("leave_roundtable_view", () => {
      if (currentRoundtableId) {
        socket.leave(currentRoundtableId);
        handleLeaveWaitingArea();
        currentRoundtableId = null;
        currentUserId = null;
      }
    });

    socket.on("disconnect", () => {
      handleLeaveWaitingArea();
    });
  });
};
