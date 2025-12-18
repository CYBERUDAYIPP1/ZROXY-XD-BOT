require("./antiCrash")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const qrcode = require("qrcode-terminal")
const fs = require("fs")
const path = require("path")
const config = require("./config")

// ================= GLOBAL =================
const plugins = []
const startTime = Date.now()

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

  // ================= CONNECTION =================
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true })

    if (connection === "open") {
      console.log("🔥 ZROXY BOT CONNECTED SUCCESSFULLY")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log("❌ Connection closed. Reason:", reason)

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...")
        startBot()
      }
    }
  })

  // ================= MESSAGES =================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg || !msg.message) return   // ✅ ONLY ignore empty messages

      const from = msg.key.remoteJid
      const rawSender = msg.key.participant || from
      const sender = rawSender.split(":")[0] + "@s.whatsapp.net"

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""

      const isOwner = config.owner.includes(sender)

      // PREFIX CHECK
      if (!text.startsWith(config.prefix)) return

      // PRIVATE MODE CHECK
      if (config.mode === "private" && !isOwner) return

      const args = text.slice(config.prefix.length).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      // ================= BUILT-IN COMMANDS =================
      const runtime = Math.floor((Date.now() - startTime) / 1000)

      if (command === "ping") {
        return sock.sendMessage(from, { text: "🏓 Pong! ZROXY-Bot is alive" })
      }

      if (command === "alive") {
        return sock.sendMessage(from, {
          text: "🔥 ZROXY BOT ONLINE\n🛡 Anti-crash active ✅"
        })
      }

      if (command === "runtime") {
        return sock.sendMessage(from, {
          text: `⏱ Uptime: ${runtime} seconds`
        })
      }

      // ================= PLUGIN COMMANDS =================
      const plugin = plugins.find(p => p.command === command)

      if (plugin && typeof plugin.run === "function") {
        try {
          await plugin.run(sock, msg, args)
        } catch (err) {
          console.log("❌ Plugin Error:", err.message)
          await sock.sendMessage(from, {
            text: `❌ Plugin Error: ${err.message}`
          })
        }
      }

      // ================= PLUGIN INTERCEPTORS =================
      plugins.forEach(p => {
        if (typeof p.intercept === "function") {
          try {
            p.intercept(sock, msg)
          } catch (e) {
            console.log("❌ Intercept error:", e.message)
          }
        }
      })

    } catch (err) {
      console.log("❌ Message Handler Error:", err.message)
    }
  })
}

startBot()
