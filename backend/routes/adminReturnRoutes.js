
const express = require("express");
const mongoose = require("mongoose");

const Rental = require("../models/Rental");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Only administrators can manage rental returns
router.use(protect, adminOnly);

// GET /api/admin/returns
// Fetch rentals that have been picked up or have return activity
router.get("/", async (req, res) => {
  try {
    const rentals = await Rental.find({
      pickupStatus: "Picked Up",
      status: { $ne: "Cancelled" }
    })
      .populate("customer", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: rentals.length,
      returns: rentals
    });
  } catch (error) {
    console.error("Fetch returns error:", error);
    res.status(500).json({
      message: "Unable to fetch return records."
    });
  }
});

// PATCH /api/admin/returns/:id
// Update return inspection details
router.patch("/:id", async (req, res) => {
  try {
    const { returnStatus, returnCondition, returnNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid rental ID."
      });
    }

    const allowedStatuses = [
      "Return Scheduled",
      "Returned",
      "Under Inspection",
      "Inspected"
    ];

    const allowedConditions = [
      "Not Inspected",
      "Good",
      "Minor Damage",
      "Major Damage",
      "Missing Parts"
    ];

    if (
      returnStatus !== undefined &&
      !allowedStatuses.includes(returnStatus)
    ) {
      return res.status(400).json({
        message: "Invalid return status."
      });
    }

    if (
      returnCondition !== undefined &&
      !allowedConditions.includes(returnCondition)
    ) {
      return res.status(400).json({
        message: "Invalid return condition."
      });
    }

    if (
      returnNotes !== undefined &&
      (typeof returnNotes !== "string" || returnNotes.length > 1000)
    ) {
      return res.status(400).json({
        message: "Return notes must not exceed 1000 characters."
      });
    }

    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        message: "Rental record not found."
      });
    }

    if (rental.pickupStatus !== "Picked Up") {
      return res.status(400).json({
        message: "The rental must be picked up before return inspection."
      });
    }

    if (returnStatus !== undefined) {
      rental.returnStatus = returnStatus;

      if (
        returnStatus === "Returned" &&
        !rental.actualReturnDate
      ) {
        rental.actualReturnDate = new Date();
      }
    }

    if (returnCondition !== undefined) {
      rental.returnCondition = returnCondition;
    }

    if (returnNotes !== undefined) {
      rental.returnNotes = returnNotes.trim();
    }

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate("customer", "name email");

    res.status(200).json({
      success: true,
      message: "Return inspection updated successfully.",
      rental: updatedRental
    });
  } catch (error) {
    console.error("Update return error:", error);
    res.status(500).json({
      message: "Unable to update return inspection."
    });
  }
});

module.exports = router;
