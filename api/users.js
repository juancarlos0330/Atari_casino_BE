const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const config = require("../config/config");
const jwt = require("jsonwebtoken");
const passport = require("passport");

// Load User model
const User = require("../models/User");

// Load Game model
const Game = require("../models/Game");

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post("/register", (req, res) => {
  let errors = {};
  User.findOne({ account: req.body.account }).then((user) => {
    if (user) {
      errors.account = "Address already exists";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.account, {
        s: "200", // Size
        r: "pg", // Rating
        d: "mm", // Default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        account: req.body.account,
      });

      newUser
        .save()
        .then((user) => {
          const payload = {
            id: user._id,
            email: user.email,
            name: user.name,
            balance: user.balance,
            avatar: user.avatar,
            account: user.account,
          }; // Create JWT Payload

          // Get game items
          Game.find().then((games) => {
            // Sign Token
            jwt.sign(
              payload,
              config.secretOrKey,
              { expiresIn: 3600 },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token,
                  gamelist: games,
                });
              }
            );
          });
        })
        .catch((err) => console.log(err));
    }
  });
});

// @route   POST api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post("/login", (req, res) => {
  const account = req.body.address;
  let errors = {};
  // Find user by email
  User.findOne({ account: account }).then((user) => {
    // Check for user
    if (!user) {
      errors.account = "Account not found";
      return res.status(400).json(errors);
    }

    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      balance: user.balance,
      avatar: user.avatar,
      account: user.account,
    }; // Create JWT Payload

    // Get game items
    Game.find().then((games) => {
      // Sign Token
      jwt.sign(
        payload,
        config.secretOrKey,
        { expiresIn: 3600 },
        (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token,
            gamelist: games,
          });
        }
      );
    });
  });
});

// @route   POST api/users/savedepositamount
// @desc    Save deposited amount
// @access  Public
router.post("/savedepositamount", (req, res) => {
  User.findOne({ _id: req.body.user_id }).then((users) => {
    users.balance = users.balance + req.body.depAmount;
    users.save().then((user) => {
      const payload = {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        avatar: user.avatar,
        account: user.account,
      }; // Create JWT Payload

      jwt.sign(
        payload,
        config.secretOrKey,
        { expiresIn: 3600 },
        (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token,
          });
        }
      );
    });
  });
});

module.exports = router;
