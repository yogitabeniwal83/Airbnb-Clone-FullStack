const express = require("express");
const authRouter = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require('../middlewares/authMiddleware');

authRouter.get("/api/session", authController.getSession);
authRouter.post("/api/login", authController.postLogin);
authRouter.post("/api/signup", authController.postSignup);
authRouter.post('/api/become-host', authMiddleware, authController.postBecomeHost);
authRouter.post("/api/logout", authController.postLogout);

module.exports = authRouter;
