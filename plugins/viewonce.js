const fs = require("fs")
const path = require("path")

module.exports = {
  command: "viewonce",
  run: async (sock, msg) => {
    try {
      const from = msg.key.remoteJid

      // Must reply to a view-once message
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      if (!quoted?.viewOnceMessage) {
        return sock.sendMessage(from, { text: "❌ Please reply to a view-once message and type .viewonce BEFORE opening it" })
      }

      const viewOnceMsg = quoted.viewOnceMessage
      const type = Object.keys(viewOnceMsg.message)[0] // imageMessage / videoMessage

      // Download media
      const buffer = await sock.downloadMediaMessage(viewOnceMsg, "buffer")

      // Save folder
      const folder = path.join(__dirname, "../downloaded_viewonce")
      if (!fs.existsSync(folder)) fs.mkdirSync(folder)

      const fileName = `${Date.now()}.${type.includes("image") ? "jpg" : "mp4"}`
      const filePath = path.join(folder, fileName)
      fs.writeFileSync(filePath, buffer)

      await sock.sendMessage(from, { text: `✅ Saved view-once media: ${fileName}` })

    } catch (err) {
      console.log("❌ ManualViewOnce Error:", err.message)
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${err.message}` })
    }
  }
}
