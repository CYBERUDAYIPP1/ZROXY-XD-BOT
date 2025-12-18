const os = require("os");

module.exports = {
  command: "menu",

  async run(sock, msg) {
    const from = msg.key.remoteJid

    // Dynamic uptime
    const uptimeSeconds = process.uptime()
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = Math.floor(uptimeSeconds % 60)
    const uptime = `${hours}h ${minutes}m ${seconds}s`

    const menuText = `
╔═══✨ ZROXY BOT ✨═══╗
║
║  🤖 *Main Commands*
║  ├ 🏓 *.ping* → Check bot
║  ├ 🔥 *.alive* → Bot status
║  ├ ⏱ *.runtime* → Uptime: ${uptime}
║
║  🎨 *Media Commands*
║  ├ 🧷 *.sticker* → Image/Video to sticker
║
║  ⚙️ *Owner Commands*
║  ├ 🔐 *.mode private/public* → Change bot mode
║  ├ ⚡ *.restart* → Restart bot
║
╚════════════════════╝
💡 Tip: Type command with prefix (${msg.message.conversation?.[0] || "."})
`

    await sock.sendMessage(from, { text: menuText })
  }
}
