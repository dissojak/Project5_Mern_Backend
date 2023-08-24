const express = require("express");
const UC = require("../controller/UsersController");
const { check } = require("express-validator");
const router = express.Router();

router.get("/", UC.getUsers);
router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("pw").isLength({ min: 6 }),
  ],
  UC.signupUser
);
router.post("/login", UC.loginUser);

module.exports = router;
