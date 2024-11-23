const express = require("express");
const { authenticated } = require("../middlewares/auth");
const { register, login, googleLogin, logout, refreshToken } = require("../controllers/authController");

const router = express.Router();

router.route("/users/register").post(register);
router.route("/users/login").post(login);
router.route("/users/google").post(googleLogin);
router.route("/users/token-refresh").post( refreshToken);

module.exports = router;
