import nodemailer from "nodemailer";

const send_mail = async ({ email, subject, body }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_APP_PASS, // must be an App Password, not your normal Gmail password
      },
    });

    const mailOption = {
      from: process.env.MY_GMAIL,
      to: email,
      subject,
      html: body,
    };

    await transporter.sendMail(mailOption);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Mail error:", error);
    return { success: false, message: "Failed to send OTP", error };
  }
};

export default send_mail;
