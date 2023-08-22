const express = require("express");
const PC = require("../controller/PlacesController");
const { check } = require("express-validator");

const router = express.Router();

router.get("/:pid", PC.getPlaceById);
router.post("/", [check("title").not().isEmpty(), check('description').isLength({min:5}),], PC.createPlace);
router.patch("/:pid",[check("title").not().isEmpty(), check('description').isLength({min:5}),], PC.updatePlace);
router.delete("/:pid", PC.deletePlace);
router.get("/user/:uid", PC.getPlacesByUserId);

module.exports = router;
