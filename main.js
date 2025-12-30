require("./antiCrash")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const fs = require("fs")
const path = require("path")
const config = require("./config")
const pino = require("pino")

// ================= GLOBAL =================
const plugins = []
global.plugins = plugins
const startTime = Date.now()

// ================= STARTUP UI =================
function showStartupBanner() {
  console.clear()
  console.log(`
╭────────────────────────────────────────────╮
│        🚀 ZROXY WHATSAPP BOT STARTED        │
╰────────────────────────────────────────────╯

🔐 Initializing secure session...
🔑 Authentication loaded successfully
`)
}

function showPairingInfo() {
  console.log(`
🔗 Pairing status:
   ├─ 📱 Waiting for device pairing
   └─ 🔐 Secure session will be established
`)
}

function showConnectedStatus() {
  console.log(`
📡 Connecting to WhatsApp servers...

✅ Connection established
📤 Encryption keys synchronized
📥 Message listener activated

ℹ️ Notice: Some older messages could not be decrypted
ℹ️ This is expected after a fresh login and will resolve automatically

🟢 Status: ONLINE • STABLE • READY
`)
}

// ===== BOT IMAGE =====
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
        console.error(`❌ Plugin load failed: ${file}`, e.message)
      }
    })
}

// ================= START BOT =================
async function startBot() {
  showStartupBanner()

  const { state, saveCreds } = await useMultiFileAuthState("session")

  const sock = makeWASocket({
    auth: state,
    markOnlineOnConnect: true,
    syncFullHistory: false,

    // 🔥 SHOW ONLY MAIN ERRORS (NO JSON SPAM)
    logger: pino({ level: "error" })
  })

  sock.ev.on("creds.update", saveCreds)

  // ===== IMAGE REPLY HELPER =====
  sock.replyWithImage = async (jid, text) => {
    if (BOT_IMAGE) {
      return sock.sendMessage(jid, { image: BOT_IMAGE, caption: text })
    }
    return sock.sendMessage(jid, { text })
  }

  // ================= PAIR CODE =================
  if (!state.creds.registered) {
    showPairingInfo()

    const phoneNumber = config.pairingNumber
    if (!phoneNumber) {
      console.error("❌ pairingNumber missing in config.js")
      process.exit(1)
    }

    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber)
        code = code.match(/.{1,4}/g).join("-")

        console.log(`
📱 DEVICE PAIRING REQUIRED
🔢 Pairing Code: ${code}
ℹ️ Enter this code in WhatsApp → Linked Devices
`)
      } catch (err) {
        console.error("❌ Pairing error:", err.message)
      }
    }, 3000)
  }

  // ================= CONNECTION =================
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      showConnectedStatus()

      // ✅ SELF MESSAGE WITH IMAGE
      try {
        const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net"
        const time = new Date().toLocaleString()

        const text =
          `🤖 ZROXY BOT CONNECTED\n\n` +
          `⏰ Time: ${time}\n` +
          `✅ Status: Online & Working`

        await sock.replyWithImage(botJid, text)
      } catch (err) {
        console.error("⚠ Self message error:", err.message)
      }
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) startBot()
    }
  })

  // ================= MESSAGE HANDLER =================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0]
      if (!msg?.message) return
      if (!msg?.key?.remoteJid) return

      const from = msg.key.remoteJid
      if (from === "status@broadcast") return

      const sender =
        (msg.key.participant || from).split(":")[0] + "@s.whatsapp.net"

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ""

      if (!text.startsWith(config.prefix)) return

      const args = text.slice(config.prefix.length).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      const isOwner = config.owner.includes(sender)
      if (config.mode === "private" && !isOwner) return

      const runtime = Math.floor((Date.now() - startTime) / 1000)

      // ================= BUILT-IN COMMANDS =================
      if (command === "ping") {
        return sock.replyWithImage(from, "🏓 Pong! Bot is working")
      }

      if (command === "alive") {
        return sock.replyWithImage(from, "🔥 ZROXY BOT ONLINE")
      }

      if (command === "runtime") {
        return sock.replyWithImage(from, `⏱ Uptime: ${runtime}s`)
      }

      // ================= PLUGIN COMMANDS =================
      for (const p of plugins) {
        if (
          Array.isArray(p.command) &&
          p.command.includes(command) &&
          typeof p.run === "function"
        ) {
          await p.run(sock, msg, args)
        }
      }

    } catch (err) {
      console.error("❌ Message Handler Error:", err.message)
    }
  })
}

startBot()
