const express = require("express");
const router = express.Router();

const storeController = require("../controllers/storeController");
const authMiddleware = require("../middlewares/authMiddleware");
const { requireRole } = require('../middlewares/roleMiddleware');

router.get("/api/homes", storeController.getHomes);
router.get("/api/homes/:homeId", storeController.getHomeDetails);

router.use('/api/favourites', authMiddleware, requireRole('guest'));
router.get("/api/favourites", storeController.getFavouriteList);
router.post("/api/favourites/:homeId", storeController.postAddToFavourite);
router.delete("/api/favourites/:homeId", storeController.postRemoveFromFavourite);

module.exports = router;
