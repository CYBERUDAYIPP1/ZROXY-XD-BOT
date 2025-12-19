require("./antiCrash")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const config = require("./config")

// ================= GLOBAL =================
const plugins = []
global.plugins = plugins
const startTime = Date.now()

// ===== GLOBAL BOT IMAGE (USED EVERYWHERE) =====
const BOT_IMAGE_PATH = path.join(__dirname, "assets", "bot_image.jpg")
const BOT_IMAGE = fs.existsSync(BOT_IMAGE_PATH)
  ? fs.readFileSync(BOT_IMAGE_PATH)
  : null

// ================= LOAD PLUGINS =================
const pluginPath = path.join(__dirname, "plugins")
if (fs.existsSync(pluginPath)) {
  fs.readdirSync(pluginPath)
    .filter(file => file.endsWith(".js"))
    .forEach(file => {
      try {
        const plugin = require(path.join(pluginPath, file))
        plugins.push(plugin)
        console.log(`✅ Plugin loaded: ${file}`)
      } catch (e) {
        console.log(`❌ Failed plugin: ${file}`, e.message)
      }
    })
}

// ================= START BOT =================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true
  })

  sock.ev.on("creds.update", saveCreds)

  // ===== GLOBAL IMAGE REPLY HELPER =====
  sock.replyWithImage = async (jid, text) => {
    if (BOT_IMAGE) {
      return sock.sendMessage(jid, { image: BOT_IMAGE, caption: text })
    }
    return sock.sendMessage(jid, { text })
  }

  // ================= PAIR CODE =================
  if (!state.creds.registered) {
    const phoneNumber = config.pairingNumber
    if (!phoneNumber) {
      console.log("❌ pairingNumber missing in config.js")
      process.exit(1)
    }

    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber)
        code = code.match(/.{1,4}/g).join("-")
        console.log("\n📱 PAIR THIS DEVICE")
        console.log("════════════════════")
        console.log("🔢 Pairing Code:", code)
        console.log("════════════════════")
        console.log("WhatsApp → Linked Devices → Link a device → Enter code\n")
      } catch (err) {
        console.log("❌ Pairing error:", err.message)
      }
    }, 3000)
  }

  // ================= CONNECTION =================
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("🔥 ZROXY BOT CONNECTED SUCCESSFULLY")

      // Send UI message to bot's own number
      try {
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net"
        const now = new Date().toLocaleString()
        const uiMessage = `🤖 BOT CONNECTED SUCCESSFULLY\n\n⏰ Time: ${now}\n✅ Status: Online & Ready`
        await sock.replyWithImage(botNumber, uiMessage)
      } catch (err) {
        console.error("❌ Error sending bot connection message:", err.message)
      }
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log("❌ Connection closed. Reason:", reason)
      if (reason !== DisconnectReason.loggedOut) startBot()
    }
  })

  // ================= MESSAGES =================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0]
      if (!msg || !msg.message) return

      const from = msg.key.remoteJid
      const sender = (msg.key.participant || from).split(":")[0] + "@s.whatsapp.net"
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""

      const isOwner = config.owner.includes(sender)
      if (!text.startsWith(config.prefix)) return
      if (config.mode === "private" && !isOwner) return

      const args = text.slice(config.prefix.length).trim().split(/ +/)
      const command = args.shift().toLowerCase()
      const runtime = Math.floor((Date.now() - startTime) / 1000)

      // ============ BUILT-IN COMMANDS (WITH IMAGE) =============
      if (command === "ping") {
        return sock.replyWithImage(from, "🏓 Pong! ZROXY-Bot is alive")
      }

      if (command === "alive") {
        return sock.replyWithImage(from, "🔥 ZROXY BOT ONLINE\n🛡 Anti-crash active ✅")
      }

      if (command === "runtime") {
        return sock.replyWithImage(from, `⏱ Uptime: ${runtime} seconds`)
      }

      // ================= PLUGIN COMMANDS =================
      const plugin = plugins.find(p => p.command === command)
      if (plugin?.run) await plugin.run(sock, msg, args)

      // ================= PLUGIN INTERCEPTORS =================
      plugins.forEach(p => {
        if (typeof p.intercept === "function") p.intercept(sock, msg)
      })

    } catch (err) {
      console.log("❌ Message Handler Error:", err.message)
    }
  })
}

startBot()
