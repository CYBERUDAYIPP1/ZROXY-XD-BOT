const fs = require("fs")
const path = require("path")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  command: "[save]",
  run: async (sock, msg) => {
    const from = msg.key.remoteJid
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted) {
      return sock.sendMessage(from, { text: "❌ Reply to a media message" })
    }

    const type = Object.keys(quoted)[0]
    let folder, ext

    if (type === "imageMessage") { folder = "images"; ext = "jpg" }
    else if (type === "videoMessage") { folder = "videos"; ext = "mp4" }
    else if (type === "audioMessage") { folder = "audio"; ext = "mp3" }
    else if (type === "documentMessage") { folder = "docs"; ext = "bin" }
    else return sock.sendMessage(from, { text: "❌ Unsupported media" })

    const fakeMsg = { key: msg.key, message: quoted }
    const buffer = await downloadMediaMessage(fakeMsg, "buffer")

    const dir = path.join(__dirname, `../downloads/${folder}`)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    fs.writeFileSync(path.join(dir, `${Date.now()}.${ext}`), buffer)

    await sock.sendMessage(from, { text: "✅ Media saved" })
  }
}

