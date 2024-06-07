const { SMTPServer } = require("smtp-server");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { fromUtf8 } = require("@aws-sdk/util-utf8-node");
require("dotenv").config();

const server = new SMTPServer({
  onAuth(auth, session, callback) {
    if (
      auth.username !== process.env.SMTP_AUTH_USERNAME ||
      auth.password !== process.env.SMTP_AUTH_PASSWORD
    ) {
      return callback(new Error("Invalid username or password"));
    }
    callback(null, { user: "user-id" });
  },
  onData: async (stream, session, callback) => {
    console.log(JSON.stringify(session, null, 2));
    let mailChunks = [];
    for await (const chunk of stream) {
      mailChunks.push(chunk);
    }
    const mailBuffer = Buffer.concat(mailChunks);
    let mailContent = mailBuffer.toString("utf-8");

    // AWS SES clientを作成
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || "ap-northeast-1",
      connectionTls: true,
      credentials: process.env.AWS_ACCESS_KEY && {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // bccを抽出し、メールコンテンツに付与 ※ プロキシするとbccが消えるので対策
    const match = mailContent.match(/(?<!-)To:\s(.*?)\r?\n/i);
    if (match) {
      const toAddresses = match[1]
        .split(",")
        .map((address) => address.trim())
        .filter(Boolean);
      const bccAddresses = session.envelope.rcptTo
        .filter((to) => !toAddresses.includes(to.address))
        .map((to) => to.address);
      console.log({ toAddresses, bccAddresses });
      if (bccAddresses.length > 0) {
        mailContent = mailContent.replace(
          /To:\s(.*)\r?\n/,
          `To: $1\nBcc: ${bccAddresses.join(", ")}\n`
        );
      }
    }
    console.log(mailContent);
    // SESに送信するコマンドを作成
    const sendCommand = new SendRawEmailCommand({
      RawMessage: {
        Data: fromUtf8(mailContent),
      },
    });

    try {
      const data = await sesClient.send(sendCommand);
      console.log("SES Successful:", data);
      callback(null, "Message queued"); // メール受信完了をSMTPクライアントに通知
    } catch (err) {
      console.error("SES Error:", err);
      callback(new Error("Failed to send email"));
    }
  },
  // authOptional: true,
});

server.listen(process.env.SMTP_PORT || 2525);
