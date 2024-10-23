const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt_decode = require("jwt-decode");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

// Load User model
const Game = require("../models/Game");
const User = require("../models/User");
const GameList = require("../models/GameList");
const GameStatus = require("../models/GameStatus");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      __dirname.substr(0, __dirname.length - 11) +
        "\\frontend\\public\\assets\\upload\\game"
    );
  },
  filename: async function (req, file, cb) {
    filename = "";
    await file.originalname.split(" ").map((value, key) => {
      filename += value;
    });
    filename = Date.now() + "_" + filename;
    await cb(null, filename);
  },
});

const upload = multer({ storage: storage });

// @route   POST api/games/uploadfile
// @desc    Upload game cover image
// @access  Public
router.post("/uploadfile", upload.single("uploadfile"), (req, res) => {
  const newGames = new Game({
    user_id: req.body.u_id,
    name: req.body.name,
    description: req.body.description,
    frontendurl: req.body.frontendurl,
    backendurl: req.body.backendurl,
    game_img_src: "http://10.10.11.13:3000/assets/upload/game/" + filename,
    approve_flag: 1,
  });

  newGames.save().then((game) => {
    Game.find().then((games) => {
      res.json({
        gamelist: games,
      });
    });
  });
});

router.post("/getbalance", (req, res) => {
  const decoded = jwt_decode(req.body.token);
  GameList.findOne({
    user_id: decoded.id,
    account: decoded.account,
    game_id: req.body.game_id,
  })
    .then((gamelist) => {
      Game.findOne({ _id: req.body.game_id }).then((game) => {
        if (gamelist) {
          res.json({
            real_balance: game.balance,
            name: game.name,
            balance: gamelist.balance,
          });
        } else {
          res.json({
            real_balance: game.balance,
            name: game.name,
            balance: 0,
          });
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

// @route   POST api/games/getData
// @desc    Get user gamelist
// @access  Public
router.post("/getgamelist", (req, res) => {
  Game.find().then((games) => {
    res.json({
      gamelist: games,
    });
  });
});

// @route   POST api/games/delitem
// @desc    Delete user gamelist item
// @access  Public
router.post("/delitem", (req, res) => {
  Game.findOneAndRemove({ _id: req.body.g_id }).then((game) => {
    Game.find().then((games) => {
      res.json({
        gamelist: games,
      });
    });
  });
});

// @route   POST api/games/acceptitem
// @desc    Accept user gamelist item
// @access  Public
router.post("/acceptitem", (req, res) => {
  Game.findOne({ _id: req.body.g_id }).then((game) => {
    game.approve_flag = Boolean(true);
    game.save().then(() => {
      Game.find().then((games) => {
        res.json({
          gamelist: games,
        });
      });
    });
  });
});

// @route   POST api/games/rejectitem
// @desc    Accept user gamelist item
// @access  Public
router.post("/rejectitem", (req, res) => {
  Game.findOne({ _id: req.body.g_id }).then((game) => {
    game.approve_flag = Boolean(false);
    game.save().then(() => {
      Game.find().then((games) => {
        res.json({
          gamelist: games,
        });
      });
    });
  });
});

// @route   POST api/games/savebalance
// @desc    Save first balance
// @access  Public
router.post("/savebalance", async (req, res) => {
  await GameList.findOne({
    user_id: req.body.user_id,
    account: req.body.account,
    game_id: req.body.game_id,
  }).then((gamelists) => {
    if (gamelists) {
      gamelists.balance = gamelists.balance + req.body.balance;
      gamelists.save();
    } else {
      const newGamelist = new GameList({
        user_id: req.body.user_id,
        account: req.body.account,
        game_id: req.body.game_id,
        balance: req.body.balance,
      });
      newGamelist.save();
    }
  });

  // await Game.findOne({ _id: req.body.game_id }).then((game) => {
  //   game.balance = game.balance + Number(req.body.balance);
  //   game.save();
  // });

  await User.findOne({ account: req.body.account, _id: req.body.user_id }).then(
    (users) => {
      users.balance = users.balance - req.body.balance;
      users.save().then((user) => {
        const payload = {
          id: user._id,
          email: user.email,
          name: user.name,
          balance: user.balance,
          avatar: user.avatar,
          account: user.account,
        }; // Create JWT Payload

        // Sign Token
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
    }
  );
});

// @route   POST api/games/tokenAPI
// @desc    Check token
// @access  Public
router.post("/tokenAPI", (req, res) => {
  const decoded = jwt_decode(req.body.token);
  GameList.findOne({
    user_id: decoded.id,
    account: decoded.account,
    game_id: req.body.game_id,
  })
    .then((gamelist) => {
      if (gamelist) {
        res.json({
          real_flag: true,
          balance: gamelist.balance,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// @route   POST api/games/gamestatus
// @desc    Game start/end API
// @access  Public
router.post("/gamestatus", async (req, res) => {
  const decoded = jwt_decode(req.body.token);
  Game.findOne({ _id: req.body.game_id }).then((game) => {
    game.balance = game.balance + Number(req.body.balance);
    game.save().then(() => {
      GameList.findOne({
        user_id: decoded.id,
        account: decoded.account,
        game_id: req.body.game_id,
      }).then((gamelist) => {
        gamelist.balance = gamelist.balance - Number(req.body.balance);
        gamelist.save().then((gamelists) => {
          User.findOne({ _id: decoded.id }).then((user) => {
            user.balance = user.balance - req.body.balance;
            user.save().then(async (users) => {
              const newGamestatus = new GameStatus({
                user_id: decoded.id,
                account: decoded.account,
                game_id: req.body.game_id,
                alias_balance: req.body.balance,
              });

              await newGamestatus.save().then((games) => {
                res.json({ id: games._id });
              });
            });
          });
        });
      });
    });
  });
});

// @route   POST api/games/winlose
// @desc    Check token
// @access  Public
router.post("/winlose", async (req, res) => {
  const decoded = jwt_decode(req.body.token);
  await GameStatus.findOne({ _id: req.body.id }).then(async (gamestatus) => {
    if (
      gamestatus.user_id == decoded.id &&
      gamestatus.game_id == req.body.game_id
    ) {
      if (req.body.game_win == true) {
        Game.findOne({ _id: req.body.game_id }).then((game) => {
          const gamebalances = game.balance;
          game.balance = game.balance - Number(req.body.balance);
          if (game.balance < 0) {
            game.balance = Number(0);
          }
          game.save().then(() => {
            gamestatus.game_win = req.body.game_win;
            gamestatus.balance =
              Number(req.body.balance) - Number(gamestatus.alias_balance);
            gamestatus.save().then((gamestat) => {
              GameList.findOne({
                user_id: decoded.id,
                account: decoded.account,
                game_id: req.body.game_id,
              }).then((gamelist) => {
                if (Number(gamebalances) < Number(req.body.balance)) {
                  gamelist.balance = gamelist.balance + Number(gamebalances);
                } else {
                  gamelist.balance =
                    gamelist.balance + Number(req.body.balance);
                }

                gamelist.save().then((gamelists) => {
                  User.findOne({ _id: decoded.id }).then((user) => {
                    user.balance = user.balance + Number(req.body.balance);
                    user.save().then(() => {
                      res.json({
                        status: "win",
                      });
                    });
                  });
                });
              });
            });
          });
        });
      } else {
        gamestatus.game_win = req.body.game_win;
        gamestatus.save().then(() => {
          res.json({
            status: "lose",
          });
        });
      }
    }
  });
});

module.exports = router;
