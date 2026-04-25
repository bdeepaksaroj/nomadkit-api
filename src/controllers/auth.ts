import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { connectDB } from "../lib/mongodb";
import { redis } from "../lib/redis";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/auth";
import { sendOTPEmail, sendWelcomeEmail } from "../lib/email";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.issues[0].message });
      return;
    }

    await connectDB();
    const { name, email, password } = body.data;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    const otp = generateOTP();
    await redis.set(`otp:${email}`, otp, { ex: 600 });

    await sendOTPEmail(email, otp, name);

    res.status(201).json({
      message:
        "Registration successful. Check your email for the verification code.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const body = verifySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.issues[0].message });
      return;
    }

    const { email, otp } = body.data;

    const storedOTP = await redis.get(`otp:${email}`);
    console.log("Stored OTP:", storedOTP, "Provided OTP:", otp);
    if (!storedOTP || String(storedOTP) !== String(otp)) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true },
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await redis.del(`otp:${email}`);
    await sendWelcomeEmail(email, user.name);

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Email verified successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.issues[0].message });
      return;
    }

    await connectDB();
    const { email, password } = body.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.isVerified) {
      res.status(401).json({ error: "Please verify your email first" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken(payload.userId);

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
}

export async function resendOTP(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }

    const otp = generateOTP();
    await redis.set(`otp:${email}`, otp, { ex: 600 });
    await sendOTPEmail(email, otp, user.name);

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
}
