const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const sharp = require("sharp"); // npm i sharp
const fs = require("fs");

module.exports = {
  command: ["sticker2img", "s2i"],

  async run(sock, msg) {
    try {
      const from = msg.key.remoteJid;

      // 🔎 GET QUOTED STICKER
      const quotedMsg =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      let stickerMessage = null;

      if (msg.message.stickerMessage) {
        stickerMessage = msg.message;
      } else if (quotedMsg?.stickerMessage) {
        stickerMessage = { message: quotedMsg };
      }

      if (!stickerMessage) {
        return sock.sendMessage(from, {
          text: "❌ Reply to a sticker with .sticker2img to convert it to image"
        });
      }

      // ⬇️ DOWNLOAD STICKER
      const buffer = await downloadMediaMessage(
        stickerMessage,
        "buffer",
        {},
        { logger: console }
      );

      // ⬇️ CONVERT WEBP STICKER TO PNG
      const outputPath = `./sticker_${Date.now()}.png`;
      await sharp(buffer).png().toFile(outputPath);

      // ⬇️ SEND IMAGE BACK
      const imageBuffer = fs.readFileSync(outputPath);
      await sock.sendMessage(from, { image: imageBuffer });

      // Optional: delete local file
      fs.unlinkSync(outputPath);

    } catch (err) {
      console.log("❌ Sticker to Image Error:", err.message);
    }
  }
};
