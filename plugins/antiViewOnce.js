const fs = require("fs")
const path = require("path")

module.exports = {
  command: "antiview", // optional trigger command, mainly auto
  run: async (sock, msg) => {
    try {
      const from = msg.key.remoteJid
      const isViewOnce = msg.message?.viewOnceMessage

      if (!isViewOnce) return // ignore non-view-once messages

      const type = Object.keys(isViewOnce.message)[0] // imageMessage / videoMessage
      const mediaMessage = isViewOnce.message[type]

      // Download media
      const buffer = await sock.downloadMediaMessage(msg, "buffer")

      // Create folder if not exists
      const folder = path.join(__dirname, "../downloaded_viewonce")
      if (!fs.existsSync(folder)) fs.mkdirSync(folder)

      const fileName = `${Date.now()}.${type.includes("image") ? "jpg" : "mp4"}`
      const filePath = path.join(folder, fileName)
      fs.writeFileSync(filePath, buffer)

      console.log(`✅ Saved view-once media: ${fileName}`)

      // Optional: send saved media to owner
      // sock.sendMessage(config.owner[0], { [type.includes("image") ? "image" : "video"]: buffer, caption: "Saved view-once media" })

    } catch (err) {
      console.log("❌ AntiViewOnce Error:", err.message)
    }
  }
}
