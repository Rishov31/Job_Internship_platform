const express = require("express");
const router = express.Router();
const {
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getAdminResources,
  toggleLike,
} = require("../controllers/resourceController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");

// Public routes
router.get("/", getAllResources);
router.get("/:id", getResource);
router.post("/:id/like", toggleLike);

// Admin only routes
router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/admin/all", getAdminResources);
router.post("/", createResource);
router.put("/:id", updateResource);
router.delete("/:id", deleteResource);

module.exports = router;
