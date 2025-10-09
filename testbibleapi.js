const fetch = require("node-fetch");

const API_KEY = "ad4f0e6ae193b95241077609613ace6c";

(async () => {
  try {
    const res = await fetch("https://api.scripture.api.bible/v1/bibles", {
      headers: { "api-key": API_KEY },
    });

    console.log("🔎 Status:", res.status);

    const data = await res.json();
    console.log("📖 Biblias disponibles:");
    data.data.forEach((bible) => {
      console.log(`${bible.id} - ${bible.name} (${bible.language.name})`);
    });
  } catch (err) {
    console.error("❌ Error probando fetch:", err);
  }
})();
