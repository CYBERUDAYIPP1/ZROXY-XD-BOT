// SIMPLE IN-MEMORY STORE
const messageStore = {}

module.exports = {
  command: null, // auto

  intercept: async (sock, msg) => {
    try {
      // SAVE NORMAL MESSAGES
      if (msg.message && !msg.message.protocolMessage) {
        messageStore[msg.key.id] = {
          jid: msg.key.remoteJid,
          sender: msg.key.participant || msg.key.remoteJid,
          text:
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            null
        }
        return
      }

      // DETECT DELETE
      if (msg.message?.protocolMessage?.type === 0) {
        const deletedId = msg.message.protocolMessage.key.id
        const data = messageStore[deletedId]
        if (!data || !data.text) return

        const user = data.sender.split("@")[0]

        await sock.sendMessage(data.jid, {
          text:
            `🛡 *ANTI DELETE*\n\n` +
            `👤 User: ${user}\n` +
            `🗑 Deleted message:\n\n` +
            `💬 "${data.text}"`
        })

        delete messageStore[deletedId]
      }

    } catch (e) {
      console.log("❌ AntiDelete Error:", e.message)
    }
  }
}
