const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const GamesSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  game_img_src: {
    type: String,
    required: true,
  },
  frontendurl: {
    type: String,
    required: true,
  },
  backendurl: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
  approve_flag: {
    type: Boolean,
    default: false,
  },
  hashaddress: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Game = mongoose.model("games", GamesSchema);
