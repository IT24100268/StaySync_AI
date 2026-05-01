const nodemailer = require("nodemailer");
const env = require("./env");

let transporter;

function createTransporter() {
  if (!env.mail.user || !env.mail.pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: env.mail.host === "smtp.gmail.com" ? "gmail" : undefined,
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure || env.mail.port === 465,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  });
}

function getMailer() {
  if (transporter === undefined) {
    transporter = createTransporter();
  }

  return transporter;
}

module.exports = {
  getMailer,
};
