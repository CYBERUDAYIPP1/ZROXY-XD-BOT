const { Sticker, StickerTypes } = require("wa-sticker-formatter")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  command: "[sticker]",

  async run(sock, msg) {
    try {
      const from = msg.key.remoteJid

      // 🔎 FIND IMAGE / VIDEO
      const quotedMsg =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

      let mediaMessage = null

      if (msg.message.imageMessage || msg.message.videoMessage) {
        mediaMessage = msg.message
      } else if (
        quotedMsg?.imageMessage ||
        quotedMsg?.videoMessage
      ) {
        mediaMessage = { message: quotedMsg }
      }

      if (!mediaMessage) {
        return sock.sendMessage(from, {
          text: "❌ Send or reply to an image/video with .sticker"
        })
      }

      // ⬇️ DOWNLOAD MEDIA (CORRECT WAY)
      const buffer = await downloadMediaMessage(
        mediaMessage,
        "buffer",
        {},
        { logger: console }
      )

      const mimetype =
        mediaMessage.message?.imageMessage?.mimetype ||
        mediaMessage.message?.videoMessage?.mimetype

      const type = mimetype.startsWith("video")
        ? StickerTypes.FULL
        : StickerTypes.DEFAULT

      const sticker = new Sticker(buffer, {
        pack: "ZROXY BOT",
        author: "CYBER UDAYIPP",
        type
      })

      const stickerBuffer = await sticker.toBuffer()

      await sock.sendMessage(from, { sticker: stickerBuffer })

    } catch (err) {
      console.log("❌ Sticker Error:", err.message)
    }
  }
}

