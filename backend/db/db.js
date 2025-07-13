const mongoose = require("mongoose");
const { driver, createAstraUri } = require("stargate-mongoose");

let failedPingCount = 0;
const MAX_FAILED_PINGS = 3; // max tolerated ping failures before exit

const connectToAstraDb = async () => {
  const uri = createAstraUri(
    process.env.ASTRA_DB_API_ENDPOINT,
    process.env.ASTRA_DB_APPLICATION_TOKEN
  );

  mongoose.set("autoCreate", true); // Auto-create collections if they don't exist
  mongoose.setDriver(driver); // Use Stargate driver

  try {
    await mongoose.connect(uri, {
      isAstra: true, // Specifies that the connection is for AstraDB
    });
    console.log("✅ Connected to AstraDB");
  } catch (err) {
    console.error("❌ Failed to connect to AstraDB:", err);
    process.exit(1); // Optional: exit if first connect fails
  }

  startPingMonitor();
};

const startPingMonitor = () => {
  setInterval(async () => {
    try {
      const state = mongoose.connection.readyState;
      
      if (state !== 1) { // state 1 means connected
        throw new Error(`AstraDB not connected. State: ${state}`);
      }

      // If we've been through failures, notify success
      if (failedPingCount > 0) {
        console.log("✅ AstraDB ping successful after failures");
      }

      failedPingCount = 0; // reset on success
    } catch (err) {
      failedPingCount++;
      console.error(`⚠️ AstraDB ping failed (${failedPingCount}/${MAX_FAILED_PINGS}):`, err.message);

      if (failedPingCount >= MAX_FAILED_PINGS) {
        console.error("🔥 Too many failed pings. Restarting process...");
        process.exit(1); // Let PM2 restart it cleanly
      }
    }
  }, 2 * 60 * 1000); // every 2 minutes
};

module.exports = { connectToAstraDb };
