import { Request, Response } from "express";
import { RoundtableParticipant, User } from "../db/models";

export const getRoundtableParticipants = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { roundtableId } = req.params;

    if (!roundtableId) {
      return res
        .status(400)
        .json({
          status: false,
          message: "Roundtable ID parameter is required.",
        });
    }

    const members = await RoundtableParticipant.findAll({
      where: { roundtableId: String(roundtableId) },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "profilePic", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      status: true,
      participants: members,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export const getParticipantDetails = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { roundtableId, userId } = req.params;

    if (!roundtableId || !userId) {
      return res.status(400).json({
        status: false,
        message: "Both roundtableId and userId path parameters are required.",
      });
    }

    const participant = await RoundtableParticipant.findOne({
      where: {
        roundtableId: String(roundtableId),
        userId: String(userId),
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "profilePic", "email", "deviceToken"],
        },
      ],
    });

    if (!participant) {
      return res.status(404).json({
        status: false,
        message:
          "No historic relationship registry matching those identifiers was found.",
      });
    }

    return res.status(200).json({
      status: true,
      participant,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
