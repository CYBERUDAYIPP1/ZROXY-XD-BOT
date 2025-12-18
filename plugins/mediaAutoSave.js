const fs = require("fs")
const path = require("path")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const mediaConfig = require("../mediaConfig")

module.exports = {
  intercept: async (msg) => {
    if (!mediaConfig.autoSave) return

    try {
      const m = msg.message
      if (!m) return

      const type = Object.keys(m)[0]
      let folder, ext

      if (type === "imageMessage") { folder = "images"; ext = "jpg" }
      else if (type === "videoMessage") { folder = "videos"; ext = "mp4" }
      else if (type === "audioMessage") { folder = "audio"; ext = "mp3" }
      else if (type === "documentMessage") { folder = "docs"; ext = "bin" }
      else return

      const buffer = await downloadMediaMessage(msg, "buffer")

      const dir = path.join(__dirname, `../downloads/${folder}`)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      fs.writeFileSync(path.join(dir, `${Date.now()}.${ext}`), buffer)
      console.log("📥 Auto media saved")
    } catch (e) {
      console.log("❌ AutoSave Error:", e.message)
    }
  }
}
