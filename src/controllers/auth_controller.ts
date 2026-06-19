import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../db/models";
import { sendVerificationCodeWithResend } from "../utils/mailer";
import { v4 as uuidv4 } from "uuid";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { id: userId, email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: ACCESS_EXPIRY },
  );
  const refreshToken = jwt.sign(
    { id: userId, email },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_EXPIRY },
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, id: clientProvidedId } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ status: false, error: "Missing required onboarding values." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: false,
        error: "An account with this email address already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const userId = clientProvidedId || uuidv4();

    const newUser = await User.create({
      id: userId,
      name,
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpiresAt: otpExpiry,
      isVerified: false,
    });

    await sendVerificationCodeWithResend(email, otp, "registration");

    return res.status(201).json({
      status: true,
      message: "Account initiated. Secure code dispatched to inbox.",
      userId: newUser.id,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ status: false, error: "User identity registry not found." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ status: false, error: "Account is already verified." });
    }

    if (
      !user.otpExpiresAt ||
      user.otpCode !== code ||
      new Date() > user.otpExpiresAt
    ) {
      return res.status(400).json({
        status: false,
        error: "Invalid or expired authorization challenge string.",
      });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Verification success.",
      accessToken,
      refreshToken,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export const resendVerificationCode = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: false,
        error: "Email address is required to dispatch code.",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        status: false,
        error: "No account found matching this email address.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: false,
        error: "This account is already verified. Please proceed to sign in.",
      });
    }

    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const freshExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.otpCode = freshOtp;
    user.otpExpiresAt = freshExpiry;
    await user.save();

    await sendVerificationCodeWithResend(email, freshOtp, "registration");

    return res.status(200).json({
      status: true,
      message:
        "A fresh verification challenge code has been dispatched to your inbox.",
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export const signin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ status: false, error: "Invalid authorization credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: false, error: "Invalid authorization credentials." });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Access unlocked successfully.",
      accessToken,
      refreshToken,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export const maintainSession = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ status: false, error: "Session token required." });
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as any;

    const user = await User.findOne({
      where: { id: String(payload.id), refreshToken },
    });

    if (!user) {
      return res.status(403).json({
        status: false,
        error: "Expired, corrupted, or dropped session credentials.",
      });
    }

    const tokens = generateTokens(user.id, user.email);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      status: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
  } catch {
    return res
      .status(403)
      .json({ status: false, error: "Session re-authentication expired." });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ where: { refreshToken } });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return res
      .status(200)
      .json({ status: true, message: "Session dropped cleanly." });
  } catch (error: any) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const userId = String((req as any).user.id);

    await User.destroy({ where: { id: userId } });
    return res.status(200).json({
      status: true,
      message: "Profile completely purged from systems database.",
    });
  } catch (error: any) {
    return res.status(500).json({ status: false, error: error.message });
  }
};
