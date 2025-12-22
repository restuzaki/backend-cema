const { Resend } = require("resend");
const axios = require("axios");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactEmail = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    subject,
    message,
    captchaToken,
  } = req.body;

  try {
    const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const recaptchaRes = await axios.post(googleVerifyUrl);

    if (!recaptchaRes.data.success) {
      return res
        .status(400)
        .json({ success: false, message: "reCAPTCHA verification failed." });
    }

    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.ADMIN_EMAIL,
      subject: `Pesan Baru: ${subject}`,
      html: `<h3>Pesan dari ${firstName} ${lastName}</h3><p>${message}</p>`,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendContactEmail };
