const axios = require("axios");
const yts = require("yt-search");

module.exports = {
  command: ["video", "yt"],

  run: async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      return sock.sendMessage(from, { text: "❌ Usage:\n!video <youtube link | search text>" });
    }

    try {
      let videoUrl, title;

      if (query.startsWith("http")) {
        videoUrl = query;
      } else {
        const res = await yts(query);
        if (!res.videos.length) {
          return sock.sendMessage(from, { text: "❌ No results found." });
        }
        videoUrl = res.videos[0].url;
        title = res.videos[0].title;
      }

      const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}`;
      const data = await axios.get(api, { timeout: 60000 });

      const video = data?.data?.result?.mp4;
      title = title || data?.data?.result?.title || "YouTube Video";

      if (!video) throw new Error("No video link");

      await sock.sendMessage(from, {
        video: { url: video },
        mimetype: "video/mp4",
        caption: `🎬 ${title}`
      }, { quoted: msg });

    } catch (err) {
      console.error("YT Error:", err.message);
      await sock.sendMessage(from, { text: "❌ Download failed. Try again later." });
    }
  }
};
