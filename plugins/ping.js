module.exports = {
  command: "ping",
  run: async (sock, msg, args) => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "🏓 Pong!"
    })
  }
}
