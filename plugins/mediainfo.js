module.exports = {
  command: "mediainfo",
  run: async (sock, msg) => {
    const from = msg.key.remoteJid
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted) {
      return sock.sendMessage(from, { text: "❌ Reply to media" })
    }

    const type = Object.keys(quoted)[0]
    const size =
      quoted[type]?.fileLength
        ? `${(quoted[type].fileLength / 1024 / 1024).toFixed(2)} MB`
        : "Unknown"

    await sock.sendMessage(from, {
      text: `📦 Media Type: ${type}\n📏 Size: ${size}`
    })
  }
}
