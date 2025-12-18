const fs = require("fs")
const path = require("path")

// Temporary storage for view-once messages
let pendingViewOnce = {}

module.exports = {
  command: "saveview", // manual trigger command
  run: async (sock, msg) => {
    const from = msg.key.remoteJid

    // Check if we have a pending view-once message from this chat
    const data = pendingViewOnce[from]
    if (!data) return sock.sendMessage(from, { text: "❌ No pending view-once message detected. Send a new one without opening it." })

    try {
      const type = Object.keys(data.message)[0] // imageMessage / videoMessage
      const buffer = await sock.downloadMediaMessage(data, "buffer")

      // Save folder
      const folder = path.join(__dirname, "../downloaded_viewonce")
      if (!fs.existsSync(folder)) fs.mkdirSync(folder)

      const fileName = `${Date.now()}.${type.includes("image") ? "jpg" : "mp4"}`
      fs.writeFileSync(path.join(folder, fileName), buffer)

      await sock.sendMessage(from, { text: `✅ View-once media saved as: ${fileName}` })

      delete pendingViewOnce[from] // clear after saving
    } catch (err) {
      console.log("❌ SaveViewOnce Error:", err.message)
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` })
    }
  },

  // Intercept view-once messages on arrival
  intercept: (msg) => {
    const from = msg.key.remoteJid
    const viewOnce = msg.message?.viewOnceMessage
    if (viewOnce) {
      pendingViewOnce[from] = viewOnce
    }
  }
}
