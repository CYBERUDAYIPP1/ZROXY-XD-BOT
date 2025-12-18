const fs = require("fs")
const path = require("path")
const configPath = path.join(__dirname, "../config.js")

module.exports = {
  command: "mode",

  run: async (sock, msg, args) => {
    const sender = (msg.key.participant || msg.key.remoteJid).split(":")[0]
    const config = require("../config")

    if (!config.owner.includes(sender)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Owner only command"
      })
    }

    const newMode = args[0]
    if (!["public", "private"].includes(newMode)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Use: !mode public or !mode private"
      })
    }

    const newConfig = `
module.exports = {
  prefix: "${config.prefix}",
  owner: ${JSON.stringify(config.owner)},
  mode: "${newMode}"
}
`
    fs.writeFileSync(configPath, newConfig)
    delete require.cache[require.resolve("../config")]

    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Bot mode set to *${newMode.toUpperCase()}*`
    })
  }
}
