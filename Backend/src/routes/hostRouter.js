const express = require("express");
const router = express.Router();

const hostController = require("../controllers/hostController");
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use('/api/host', authMiddleware, requireRole('host'));

router.get("/api/host/homes", hostController.getHostHomes);

router.get("/api/host/edit-home/:homeId", hostController.getEditHome);

router.post("/api/host/add-home", hostController.postAddHome);

router.put("/api/host/edit-home", hostController.postEditHome);

router.delete("/api/host/delete-home/:homeId", hostController.postDeleteHome);

module.exports = router;
