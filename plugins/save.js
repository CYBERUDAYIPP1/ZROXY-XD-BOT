const fs = require("fs")
const path = require("path")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  command: ["save"], // ✅ FIXED (ARRAY)

  run: async (sock, msg) => {
    try {
      const from = msg.key.remoteJid
      const quoted =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

      if (!quoted) {
        return sock.sendMessage(from, {
          text: "❌ Reply to an image / video / audio / document"
        })
      }

      const type = Object.keys(quoted)[0]
      let folder, ext

      if (type === "imageMessage") {
        folder = "images"; ext = "jpg"
      } else if (type === "videoMessage") {
        folder = "videos"; ext = "mp4"
      } else if (type === "audioMessage") {
        folder = "audio"; ext = "mp3"
      } else if (type === "documentMessage") {
        folder = "docs"; ext = "bin"
      } else {
        return sock.sendMessage(from, {
          text: "❌ Unsupported media type"
        })
      }

      const fakeMsg = {
        key: msg.key,
        message: quoted
      }

      const buffer = await downloadMediaMessage(
        fakeMsg,
        "buffer",
        {},
        { logger: console }
      )

      const dir = path.join(__dirname, "../downloads", folder)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const filePath = path.join(dir, `${Date.now()}.${ext}`)
      fs.writeFileSync(filePath, buffer)

      await sock.sendMessage(from, {
        text: `✅ Media saved successfully\n📁 ${folder}`
      })

    } catch (err) {
      console.log("❌ Save plugin error:", err)
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠ Failed to save media"
      })
    }
  }
}
