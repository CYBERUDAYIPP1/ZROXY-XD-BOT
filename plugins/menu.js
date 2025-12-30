module.exports = {
  command: ["menu"],

  run: async (sock, msg, args) => {
    try {
      const from = msg.key.remoteJid
      const plugins = global.plugins || []

      let menuText = `╔════════════════════╗
║ 🤖 ZROXY BOT MENU
╠════════════════════╣
`

      let count = 1
      for (const p of plugins) {
        if (!p.command) continue
        menuText += `║ ${count}. .${p.command}\n`
        count++
      }

      menuText += `╠════════════════════╣
║ Total Commands: ${count - 1}
╚════════════════════╝`

      await sock.sendMessage(from, { text: menuText })
    } catch (err) {
      console.log("❌ Menu Error:", err.message)
    }
  }
}


