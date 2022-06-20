const express = require("express");
const router = express.Router();
 
const { adminLogin, createUser, getUser, getUsers, getSortedUsers, getFilteredUsers, updateUser, deleteUser} = require("../controllers/admin");

router.route("/login").get(adminLogin);
router.route("/users/create").post(createUser);
router.route("/dashboard").get(getUsers);
router.route("/users/search").get(getFilteredUsers);
router.route("/users/sort").get(getSortedUsers);
router.route("/users/:user_id?").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;