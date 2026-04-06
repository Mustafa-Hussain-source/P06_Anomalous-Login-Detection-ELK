import express from "express";
import LoginLog from "../models/loginLog.js";
import authenticationMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/recent", authenticationMiddleware, async (req, res) => {
  try {
    const logs = await LoginLog.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json(logs);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;