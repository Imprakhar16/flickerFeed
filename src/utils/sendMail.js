import nodemailer from "nodemailer";
const send_mail = async ({ email, subject, body }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_APP_PASS,
      },
    });
    const mailOption = {
      from: process.env.MY_GMAIL,
      to: email,
      subject: subject,
      html: body,
    };

    await transporter.sendMail(mailOption);
    return { success: true, message: "OTP sent Succesfully" };
  } catch (error) {
    return { success: false, message: "Failed to send OTP", error };
  }
};
 

export default send_mail;
