const express = require("express");
const { authenticated, isAdmin } = require("../middlewares/auth");
const { deleteMessageByAdmin } = require("../controllers/messageController");

const router = express.Router();

router.delete("/messages/admin/delete-message/:id", authenticated, isAdmin, deleteMessageByAdmin);

module.exports = router;
