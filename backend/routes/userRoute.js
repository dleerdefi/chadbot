const express = require("express");
const { authenticated, isAdmin } = require("../middlewares/auth");
const {
	getCurrentUser,
	updateProfile,
	uploadProfilePic,
	deleteAccount,
	deleteAccountByAdmin,
	banAccountByAdmin,
	unBanAccountByAdmin,
} = require("../controllers/userController");
const imageUpload = require("../middlewares/imageUpload");

const router = express.Router();

router.get("/users/me", authenticated, getCurrentUser);
router.put("/users/update-profile", authenticated, updateProfile);
router.put("/users/upload-profile-pic", authenticated, imageUpload("profilePic"), uploadProfilePic);
router.delete("/users/delete-account", authenticated, deleteAccount);
router.put("/users/admin/ban-account/:id", authenticated, isAdmin, banAccountByAdmin);
router.put("/users/admin/unban-account/:id", authenticated, isAdmin, unBanAccountByAdmin);

module.exports = router;
