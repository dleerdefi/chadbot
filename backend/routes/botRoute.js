const express = require("express");
const { authenticated, isAdmin } = require("../middlewares/auth");
const {
	createNewBot,
	getAllBots,
	updateBot,
	deleteBot,
	getBotDetails,
	getOwnBotDetails,
	updateOwnBot,
	getOwnAllBots,
	deleteOwnBot,
	createOwnNewBot,
} = require("../controllers/botController");
const imageUpload = require("../middlewares/imageUpload");

const router = express.Router();

// admin routes
router.route("/admin/bots/new").post(authenticated, isAdmin, imageUpload("bot"), createNewBot);
router
	.route("/admin/bots/:id")
	.get(authenticated, isAdmin, getBotDetails)
	.put(authenticated, isAdmin, imageUpload("bot"), updateBot)
	.delete(authenticated, isAdmin, deleteBot);
router.route("/admin/bots").get(authenticated, isAdmin, getAllBots);

// public routes
router.route("/bots/new").post(authenticated, imageUpload("bot"), createOwnNewBot);
router
	.route("/bots/:id")
	.get(authenticated, getOwnBotDetails)
	.put(authenticated, imageUpload("bot"), updateOwnBot)
	.delete(authenticated, deleteOwnBot);
router.route("/bots").get(authenticated, getOwnAllBots);

module.exports = router;
