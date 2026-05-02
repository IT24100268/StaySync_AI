const mongoose = require("mongoose");
const env = require("./env");
const Restaurant = require("../models/Restaurant");

async function dropLegacyRestaurantOwnerIndex() {
  const hasOwnerPath = Boolean(Restaurant.schema.path("owner"));

  if (hasOwnerPath) {
    return;
  }

  const collectionExists =
    (await mongoose.connection.db
      .listCollections({ name: Restaurant.collection.collectionName })
      .toArray()).length > 0;

  if (!collectionExists) {
    return;
  }

  const indexes = await Restaurant.collection.indexes();
  const legacyOwnerIndex = indexes.find((index) => index.name === "owner_1");

  if (!legacyOwnerIndex) {
    return;
  }

  await Restaurant.collection.dropIndex(legacyOwnerIndex.name);
  console.log("Dropped legacy restaurants.owner_1 index.");
}

async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const connection = await mongoose.connect(env.mongoUri, {
    autoIndex: true,
  });

  console.log(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
  );

  await dropLegacyRestaurantOwnerIndex();
}

module.exports = connectDatabase;
