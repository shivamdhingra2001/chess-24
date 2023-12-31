const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  rating: {
    type: Number,
    default: 1000,
  },
  gameHistory: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Game",
      },
    ],
    default: [],
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  draws: {
    type: Number,
    default: 0,
  },
  friends: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  friendRequestsSent: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  friendRequestsReceived: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  ownCommunity: {
    type: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
  },
  communityFollow: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Community",
      },
    ],
    default: [],
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
