
const express = require("express");
const mongoose = require("mongoose");

const Maintenance = require("../models/Maintenance");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin maintenance routes require administrator authentication
router.use(protect, adminOnly);

// ========================================
// GET /api/admin/maintenance
// Fetch all maintenance requests
// ========================================
router.get("/", async (req, res) => {
  try {
    const requests = await Maintenance.find()
      .populate("customer", "name email")
      .populate("rental", "status deliveryDate")
      .populate("product", "name category icon")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error("Admin maintenance fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch maintenance requests."
    });
  }
});

// ========================================
// PATCH /api/admin/maintenance/:id
// Update maintenance status and admin notes
// ========================================
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance request ID."
      });
    }

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance request status."
      });
    }

    if (
      adminNotes !== undefined &&
      (
        typeof adminNotes !== "string" ||
        adminNotes.length > 1000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Admin notes must be text up to 1000 characters."
      });
    }

    const update = {
      status
    };

    if (adminNotes !== undefined) {
      update.adminNotes = adminNotes.trim();
    }

    update.resolvedAt =
      status === "Resolved" ? new Date() : null;

    const maintenance = await Maintenance.findByIdAndUpdate(
      id,
      { $set: update },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("customer", "name email")
      .populate("rental", "status deliveryDate")
      .populate("product", "name category icon");

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance request not found."
      });
    }

    // TEMPORARY DEBUG LOG: verify the saved admin note
    console.log(
      "SAVED ADMIN NOTES:",
      maintenance.adminNotes
    );

    return res.status(200).json({
      success: true,
      message: "Maintenance request updated successfully.",
      maintenance
    });

  } catch (error) {
    console.error("Admin maintenance update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update maintenance request."
    });
  }
});

module.exports = router;
