const mediaConfig = require("../mediaConfig")

module.exports = {
  command: "media",
  run: async (sock, msg, args) => {
    const from = msg.key.remoteJid

    if (!args[0]) {
      return sock.sendMessage(from, {
        text: `
🎛 *Auto Media Save Control*

Status: ${mediaConfig.autoSave ? "ON ✅" : "OFF ❌"}

Commands:
.media on
.media off
        `
      })
    }

    if (args[0] === "on") {
      mediaConfig.autoSave = true
      return sock.sendMessage(from, { text: "✅ Auto Media Save turned ON" })
    }

    if (args[0] === "off") {
      mediaConfig.autoSave = false
      return sock.sendMessage(from, { text: "❌ Auto Media Save turned OFF" })
    }

    return sock.sendMessage(from, { text: "❌ Use .media on / off" })
  }
}
