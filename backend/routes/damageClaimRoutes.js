
const express = require("express");
const mongoose = require("mongoose");

const DamageClaim = require("../models/DamageClaim");
const Rental = require("../models/Rental");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// POST /api/damage-claims
// Customer submits a damage claim
// ========================================
router.post("/", protect, async (req, res) => {
  try {
    const {
      rentalId,
      productId,
      claimType,
      description
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(rentalId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental or product ID."
      });
    }

    const allowedTypes = [
      "Product Damage",
      "Missing Parts",
      "Delivery Damage",
      "Other"
    ];

    if (!allowedTypes.includes(claimType)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid claim type."
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

    const rentalItem = rental.items.find(
      (item) => item.product.toString() === productId
    );

    if (!rentalItem) {
      return res.status(400).json({
        success: false,
        message: "Product does not belong to this rental."
      });
    }

    const claim = await DamageClaim.create({
      customer: req.user._id,
      rental: rental._id,
      product: rentalItem.product,
      productName: rentalItem.productName,
      claimType,
      description: description.trim()
    });

    return res.status(201).json({
      success: true,
      message: "Damage claim submitted successfully.",
      claim
    });

  } catch (error) {
    console.error("Damage claim submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit damage claim."
    });
  }
});

// ========================================
// GET /api/damage-claims/my-claims
// Customer views their claims
// ========================================
router.get("/my-claims", protect, async (req, res) => {
  try {
    const claims = await DamageClaim.find({
      customer: req.user._id
    })
      .populate("rental", "status deliveryDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      claims
    });

  } catch (error) {
    console.error("Customer damage claims fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch damage claims."
    });
  }
});

module.exports = router;
