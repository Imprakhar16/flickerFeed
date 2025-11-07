import User from "../models/userModel.js";
import passport from "passport";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import send_mail from "../utils/sendMail.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

const generateOtpToken = (email, otp) => {
  return jwt.sign({ email, otp }, process.env.JWT_SECRET, { expiresIn: "10m" });
};

export const registerUser = async (req, res) => {
  try {
    const { userName, firstName, lastName, email, gender, password } = req.body || {};

    if (!userName || !firstName || !lastName || !email || !gender || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpToken = generateOtpToken(email, otp);

    let profilePhoto = req.file?.path || null;

    const newUser = new User({
      userName,
      firstName,
      lastName,
      email,
      gender,
      password: hashedPassword,
      profilePhoto,
    });

    await newUser.save();

    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
        <h2 style="color: #4CAF50;">Welcome to FlickerFeed, ${firstName}!</h2>
        <p>Thank you for registering. Please use the OTP below to verify your email address:</p>
        <h1 style="background: #f1f1f1; display: inline-block; padding: 10px 20px; border-radius: 5px;">${otp}</h1>
        <p style="font-size: 0.9em; color: #555;">This OTP is valid for 10 minutes.</p>
      </div>
    `;

    const mailResponse = await send_mail({
      email,
      subject: "FlickerFeed Email Verification OTP",
      body: emailBody,
    });

    if (!mailResponse?.success) {
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        message: "Failed to send OTP email. Please try again later.",
        error: mailResponse?.error,
      });
    }
 if (mailResponse.success){
    return res.status(201).json({
      message: "User registered successfully. OTP sent to your email.",
      user: {
        _id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        gender: newUser.gender,
        profilePhoto: newUser.profilePhoto,
      },
      otpToken,    
    });
  }
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Please register yourself first" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "You are not verified, please verify yourself" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        gender: user.gender,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};


export const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"], // Request profile and email from Google
});

export const googleAuthenticate = passport.authenticate("google", {
  failureRedirect: "/login",
  successRedirect: "/dashboard",
});

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};

export const verifyOtp = async (req, res) => {
  try {
    const { otpToken, otp } = req.body;

    if (!otpToken)
      return res.status(400).json({ message: "OTP Token is required" });
    if (!otp) return res.status(400).json({ message: "OTP is required" });
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ message: "OTP has expired. Please request a new one" });
      }
      return res.status(400).json({ message: "Invalid OTP token" });
    }

    if (decoded.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User is already verified" });

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully! You can now login",
      isVerified: true,
    });
  } catch (error) {
    res.status(500).json({ message: "server error during verification" });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) {
      return res.status(400).json({
        message: "Email already verified. You can login now.",
        isVerified: true,
      });
    }

    const otp = generateOtp();

    const emailbody = `<div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
     <h2 style="color: #4CAF50;">Hello ${user.firstName},</h2>
     <p>We received a request to resend your OTP for verifying your FlickerFeed account.</p>
     <h1 style="background: #f1f1f1; display: inline-block; padding: 10px 20px; border-radius: 5px;">${otp}</h1>
     <p style="font-size: 0.9em; color: #555;">This OTP is valid for 10 minutes. If you didn’t request this, please ignore this email.</p>
     <p style="margin-top: 20px; font-size: 0.9em; color: #888;">FlickerFeed Team</p>
   </div>`;

    const mailResponse = await send_mail({
      email,
      subject: "FlickerFeed: Here’s Your New OTP",
      body: emailbody,
    });
    if (!mailResponse.success) {
      return res.status(500).json({
        message: "Failed to send OTP email",
        error: mailResponse.error,
      });
    }

    const otpToken = generateOtpToken(user.email, otp);
    res.status(200).json({
      message: "New OTP sent to your email",
      otpToken: otpToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified)
      return res.status(400).json({ message: "Please verify yourself first" });
    const forgotToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `${
      process.env.frontEnd_URL
    }/reset-password?token=${encodeURIComponent(forgotToken)}&email=${email}`;

    const emailBody = `<div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
    <h2 style="color: #4CAF50;">Reset Your FlickerFeed Password</h2>
    <p>We received a request to reset your password.</p>
    <p>Click the button below to create a new password:</p>
    <a href="${resetLink}" style="background-color:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;">
      Reset Password
    </a>
    <p style="font-size: 0.9em; color: #555; margin-top:20px;">
      This link is valid for 15 minutes. If you didn’t request a reset, please ignore this email.
    </p>
  </div>
`;
    await send_mail({
      email: email,
      subject: "FlickerFeed: Password Reset Request",
      body: emailBody,
    });

    res.status(200).json({
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { forgotToken, newPassword } = req.body;
    if (!forgotToken)
      return res.status(404).json({ message: "Token is required" });

    if (!newPassword)
      return res.status(404).json({ message: "New password is required" });
    const decoded = jwt.verify(forgotToken, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res.status(400).json({ message: "Reset link expired" });
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
