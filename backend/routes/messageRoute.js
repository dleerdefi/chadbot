const express = require("express");
const { authenticated, isAdmin } = require("../middlewares/auth");
const { deleteMessageByAdmin, getDashboardAnalytics } = require("../controllers/messageController");

const router = express.Router();

router.delete("/messages/admin/delete-message/:id", authenticated, isAdmin, deleteMessageByAdmin);
router.get("/admin/dashboard-analytics", authenticated, isAdmin, getDashboardAnalytics);

module.exports = router;
