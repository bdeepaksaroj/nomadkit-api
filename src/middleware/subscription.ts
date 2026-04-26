import { Request, Response, NextFunction } from "express";
import { connectDB } from "../lib/mongodb";
import { Subscription } from "../models/Subscription";

export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await connectDB();
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      res
        .status(403)
        .json({ error: "Subscription required", code: "NO_SUBSCRIPTION" });
      return;
    }

    const isActive =
      subscription.status === "active" &&
      new Date(subscription.currentPeriodEnd) > new Date();

    if (!isActive) {
      res
        .status(403)
        .json({ error: "Subscription expired", code: "SUBSCRIPTION_EXPIRED" });
      return;
    }

    (req as any).plan = subscription.plan;
    next();
  } catch (error) {
    console.error("requireSubscription error:", error);
    res.status(500).json({ error: "Failed to verify subscription" });
  }
}
