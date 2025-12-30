const axios = require("axios")

module.exports = {
  command: ["short", "shorten"],
  run: async (sock, msg, args) => {
    const from = msg.key.remoteJid
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: "❌ Please provide a URL\n\nExample:\n!short https://example.com"
      })
    }

    if (!url.startsWith("http")) {
      return sock.sendMessage(from, {
        text: "❌ Invalid URL. Must start with http or https"
      })
    }

    try {
      const api = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(
        url
      )}`

      const res = await axios.get(api, { timeout: 10000 })
      const shortUrl = res.data

      if (!shortUrl || !shortUrl.startsWith("http")) {
        return sock.sendMessage(from, {
          text: "❌ Failed to shorten URL. Try again later."
        })
      }

      await sock.sendMessage(from, {
        text: `🔗 Shortened URL:\n${shortUrl}`
      })
    } catch (err) {
      console.error("Short URL Error:", err.message)
      await sock.sendMessage(from, {
        text: "❌ Error while shortening URL. Please try again later."
      })
    }
  }
}
