import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. Token transport signature missing." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    (req as any).user = decoded; // Bind context payload to running cycle thread safely
    next();
  } catch {
    return res
      .status(401)
      .json({
        error: "Unauthorized access token signature validation expired.",
      });
  }
};
