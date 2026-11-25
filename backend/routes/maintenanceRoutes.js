
const express = require("express");
const mongoose = require("mongoose");

const Maintenance = require("../models/Maintenance");
const Rental = require("../models/Rental");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Submit a maintenance request
router.post("/", protect, async (req, res) => {
  try {
    const { rentalId, productId, issueType, description } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(rentalId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental or product ID."
      });
    }

    const allowedIssueTypes = [
      "Product Not Working",
      "Physical Damage",
      "Repair Required",
      "Installation Issue",
      "Other"
    ];

    if (!allowedIssueTypes.includes(issueType)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid issue type."
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length < 10 ||
      description.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must contain 10 to 1000 characters."
      });
    }

    // Find a rental belonging to the logged-in customer
    const rental = await Rental.findOne({
      _id: rentalId,
      customer: req.user._id,
      status: "Active"
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Active rental order not found."
      });
    }

    // Confirm that the selected product belongs to this rental
    const rentalItem = rental.items.find(
      (item) => item.product.toString() === productId
    );

    if (!rentalItem) {
      return res.status(400).json({
        success: false,
        message: "This product does not belong to the selected rental."
      });
    }

    const maintenance = await Maintenance.create({
      customer: req.user._id,
      rental: rental._id,
      product: rentalItem.product,
      productName: rentalItem.productName,
      issueType,
      description: description.trim()
    });

    return res.status(201).json({
      success: true,
      message: "Maintenance request submitted successfully.",
      maintenance
    });

  } catch (error) {
    console.error("Maintenance submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit maintenance request."
    });
  }
});

// Get logged-in customer's maintenance requests
router.get("/my-requests", protect, async (req, res) => {
  try {
    const requests = await Maintenance.find({
      customer: req.user._id
    })
      .populate("rental", "status deliveryDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests
    });

  } catch (error) {
    console.error("Maintenance fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch maintenance requests."
    });
  }
});

module.exports = router;
