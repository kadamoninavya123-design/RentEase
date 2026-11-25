
const express = require("express");
const DamageClaim = require("../models/DamageClaim");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require administrator authentication
router.use(protect, adminOnly);

// ========================================
// GET /api/admin/damage-claims
// Admin views all damage claims
// ========================================
router.get("/", async (req, res) => {
  try {
    const claims = await DamageClaim.find()
      .populate("customer", "name email")
      .populate("rental", "status deliveryDate")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      claims
    });
  } catch (error) {
    console.error("Admin damage claims fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch damage claims."
    });
  }
});

// ========================================
// PATCH /api/admin/damage-claims/:id
// Admin updates claim status and notes
// ========================================
router.patch("/:id", async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const allowedStatuses = [
      "Pending",
      "Under Review",
      "Approved",
      "Rejected",
      "Resolved"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid damage claim status."
      });
    }

    if (
      adminNotes !== undefined &&
      (typeof adminNotes !== "string" || adminNotes.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Admin notes must be 1000 characters or fewer."
      });
    }

    const claim = await DamageClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Damage claim not found."
      });
    }

    claim.status = status;

    if (adminNotes !== undefined) {
      claim.adminNotes = adminNotes.trim();
    }

    claim.resolvedAt =
      status === "Resolved" ? new Date() : null;

    await claim.save();

    const updatedClaim = await DamageClaim.findById(claim._id)
      .populate("customer", "name email")
      .populate("rental", "status deliveryDate")
      .populate("product", "name");

    return res.status(200).json({
      success: true,
      message: "Damage claim updated successfully.",
      claim: updatedClaim
    });
  } catch (error) {
    console.error("Admin damage claim update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update damage claim."
    });
  }
});

module.exports = router;
