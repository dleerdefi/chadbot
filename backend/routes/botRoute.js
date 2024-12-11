const express = require("express");
const { authenticated, isAdmin } = require("../middlewares/auth");
const { createNewBot, getAllBots, updateBot, deleteBot, getBotDetails } = require("../controllers/botController");
const imageUpload = require("../middlewares/imageUpload");

const router = express.Router();

router.route("/bots/admin").get(authenticated, isAdmin, getAllBots);
router.route("/bots/new").post(authenticated, isAdmin, imageUpload("bot"), createNewBot);
router
	.route("/bots/:id")
	.get(authenticated, isAdmin, getBotDetails)
	.put(authenticated, isAdmin, imageUpload("bot"), updateBot)
	.delete(authenticated, isAdmin, deleteBot);

module.exports = router;
