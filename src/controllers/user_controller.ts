import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../db/models";

/**
 * Fetches the currently authenticated user profile based on the JWT token context
 */
export const getMyProfile = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "otpCode", "otpExpiresAt", "refreshToken"],
      },
    });

    if (!user) {
      return res
        .status(404) // 🛑 Changed from 200 to 404 (Not Found)
        .json({ status: false, error: "User profile not found." });
    }

    return res.status(200).json({ status: true, user });
  } catch (error: any) {
    return res
      .status(500) // 🛑 Changed from 200 to 500 (Internal Server Error)
      .json({ status: false, error: error.message });
  }
};

/**
 * Fetches user metadata based on a specific ID
 */
export const getUserById = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        // 🛑 Changed from 200 to 400 (Bad Request)
        status: false,
        error: "Missing required user ID string parameter.",
      });
    }

    const user = await User.findByPk(String(id), {
      attributes: {
        exclude: [
          "password",
          "otpCode",
          "otpExpiresAt",
          "refreshToken",
          "deviceToken",
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        // 🛑 Changed from 200 to 404 (Not Found)
        status: false,
        error: "Requested user identity does not exist.",
      });
    }

    return res.status(200).json({ status: true, user });
  } catch (error: any) {
    return res
      .status(500) // 🛑 Changed from 200 to 500 (Internal Server Error)
      .json({ status: false, error: error.message });
  }
};

/**
 * Fetches user metadata based on a specific email address string
 */
export const getUserByEmail = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400) // 🛑 Changed from 200 to 400 (Bad Request)
        .json({ status: false, error: "Email query parameter is required." });
    }

    // Force string fallback to prevent array formatting evaluation crashes
    const emailString = Array.isArray(email) ? String(email[0]) : String(email);

    const user = await User.findOne({
      where: { email: emailString.trim() },
      attributes: {
        exclude: [
          "password",
          "otpCode",
          "otpExpiresAt",
          "refreshToken",
          "deviceToken",
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        // 🛑 Changed from 200 to 404 (Not Found)
        status: false,
        error: "No user found matching this email address.",
      });
    }

    return res.status(200).json({ status: true, user });
  } catch (error: any) {
    return res
      .status(500) // 🛑 Changed from 200 to 500 (Internal Server Error)
      .json({ status: false, error: error.message });
  }
};

/**
 * Dynamically updates profile properties (name, profilePic, deviceToken, etc.)
 */
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { name, profilePic, deviceToken } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        // 🛑 Changed from 200 to 404 (Not Found)
        status: false,
        error: "User target identity registry missing.",
      });
    }

    // Assign parameters dynamically if they are passed in the request body
    if (name !== undefined) user.name = name;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (deviceToken !== undefined) user.deviceToken = deviceToken;

    await user.save();

    // Reload user data omitting sensitive fields for safe client transport
    const updatedUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "otpCode", "otpExpiresAt", "refreshToken"],
      },
    });

    return res.status(200).json({
      status: true,
      message: "User profile parameters modified successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    return res
      .status(500) // 🛑 Changed from 200 to 500 (Internal Server Error)
      .json({ status: false, error: error.message });
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        // 🛑 Changed from 200 to 400 (Bad Request)
        status: false,
        message: "Both old and new passwords are required.",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404) // 🛑 Changed from 200 to 404 (Not Found)
        .json({ status: false, message: "User context not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        // 🛑 Changed from 200 to 401 (Unauthorized)
        status: false,
        message: "The old password you entered is incorrect.",
      });
    }

    // Hash and store the newly requested credentials
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Security credential password reset successfully completed.",
    });
  } catch (error: any) {
    return res
      .status(500) // 🛑 Changed from 200 to 500 (Internal Server Error)
      .json({ status: false, message: error.message });
  }
};
