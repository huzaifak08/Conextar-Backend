import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Roundtable, RoundtableParticipant, User } from "../db/models";
import { createLiveKitRoom } from "../utils/livekit";

export const createRoundtable = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ status: false, message: "Roundtable name is required." });
    }

    let code = "";
    let isUnique = false;
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const existingCode = await Roundtable.findOne({ where: { code } });
      if (!existingCode) isUnique = true;
    }

    const roundtableId = uuidv4();

    // 🚀 Step 1: Provision the 10-participant room inside LiveKit using the UUID as the room handle string name
    await createLiveKitRoom(roundtableId);

    // Step 2: Establish persistent cluster reference database registries
    const roundtable = await Roundtable.create({
      id: roundtableId,
      name,
      code,
      createdById: userId,
      status: "active",
    });

    await RoundtableParticipant.create({
      id: uuidv4(),
      userId,
      roundtableId,
      status: "joined",
    });

    return res.status(201).json({
      status: true,
      message:
        "Roundtable and 10-person LiveKit workspace successfully established.",
      roundtable,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export const joinWithCode = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { code } = req.body;

    if (!code || code.length !== 4) {
      return res
        .status(400)
        .json({ status: false, message: "A valid 4-digit token is required." });
    }

    const roundtable = await Roundtable.findOne({
      where: { code: code.toUpperCase(), status: "active" },
    });

    if (!roundtable) {
      return res.status(444).json({
        status: false,
        message: "Active roundtable not found matching this code.",
      });
    }

    const [participant, created] = await RoundtableParticipant.findOrCreate({
      where: { userId, roundtableId: roundtable.id },
      defaults: {
        id: uuidv4(),
        userId,
        roundtableId: roundtable.id,
        status: "joined",
      },
    });

    if (!created && participant.status === "left") {
      participant.status = "joined";
      await participant.save();
    }

    return res.status(200).json({
      status: true,
      message: "Successfully registered access to roundtable.",
      roundtable,
      participant,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export const updateRoundtable = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, status } = req.body;

    const roundtable = await Roundtable.findByPk(String(id));
    if (!roundtable) {
      return res
        .status(404)
        .json({ status: false, message: "Target roundtable not found." });
    }

    if (roundtable.createdById !== userId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized. Only the creator can modify parameters.",
      });
    }

    if (name !== undefined) roundtable.name = name;
    if (status !== undefined) roundtable.status = status;

    await roundtable.save();

    return res.status(200).json({
      status: true,
      message: "Roundtable parameters updated successfully.",
      roundtable,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export const deleteRoundtable = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const roundtable = await Roundtable.findByPk(String(id));
    if (!roundtable) {
      return res
        .status(404)
        .json({ status: false, message: "Target roundtable not found." });
    }

    if (roundtable.createdById !== userId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized. Only the creator can purge this record.",
      });
    }

    await roundtable.destroy();

    return res.status(200).json({
      status: true,
      message: "Roundtable successfully dropped from system indexing.",
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export const leaveRoundtable = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const participant = await RoundtableParticipant.findOne({
      where: { userId, roundtableId: String(id) },
    });

    if (!participant || participant.status === "left") {
      return res.status(444).json({
        status: false,
        message:
          "No active historical participation record found for this roundtable.",
      });
    }

    participant.status = "left";
    await participant.save();

    return res.status(200).json({
      status: true,
      message: "Successfully left the roundtable. Feeding indexes cleared.",
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export const getMyRoundtables = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;

    const spaces = await Roundtable.findAll({
      where: { status: "active" },
      include: [
        {
          model: RoundtableParticipant,
          as: "participants",
          where: { userId, status: "joined" },
          attributes: [],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "profilePic"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: true,
      roundtables: spaces,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
