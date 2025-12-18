console.log("🛡 Anti-crash protection loaded")

process.on("uncaughtException", (err) => {
  console.log("❌ Error caught:", err.message)
})

process.on("unhandledRejection", (err) => {
  console.log("❌ Promise error caught:", err)
})
