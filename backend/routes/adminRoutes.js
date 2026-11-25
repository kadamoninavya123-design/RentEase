const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Rental = require("../models/Rental");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

// ========================================
// PATCH /api/admin/rentals/:id/restore-stock
// One-time inventory restoration for an
// already picked-up and inspected rental
// ========================================

router.patch("/rentals/:id/restore-stock", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid rental ID."
    });
  }

  let session;

  try {
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const rental = await Rental.findOneAndUpdate(
        {
          _id: id,
          pickupStatus: "Picked Up",
          returnStatus: "Inspected",
          returnCondition: "Good",
          stockRestored: { $ne: true }
        },
        {
          $set: {
            stockRestored: true,
            stockRestoredAt: new Date()
          }
        },
        {
          new: true,
          session
        }
      );

      if (!rental) {
        const error = new Error(
          "Stock restoration is not allowed. Verify pickup, inspection and restoration status."
        );
        error.statusCode = 409;
        throw error;
      }

      const quantities = new Map();

      for (const item of rental.items) {
        if (!item.product) {
          throw new Error("Rental contains a missing product reference.");
        }

        const productId = item.product.toString();
        const quantity = Number(item.quantity) || 0;

        if (quantity < 1) {
          throw new Error("Invalid rental product quantity.");
        }

        quantities.set(
          productId,
          (quantities.get(productId) || 0) + quantity
        );
      }

      for (const [productId, quantity] of quantities) {
        const result = await Product.updateOne(
          { _id: productId },
          {
            $inc: { stockQuantity: quantity },
            $set: { available: true }
          },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw new Error(`Product ${productId} was not found.`);
        }
      }
    });

    const updatedRental = await Rental.findById(id)
      .populate("customer", "name email")
      .populate("items.product", "name category icon");

    return res.status(200).json({
      success: true,
      message: "Inventory restored successfully.",
      rental: updatedRental
    });

  } catch (error) {
    console.error("One-time stock restoration error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to restore inventory."
    });

  } finally {
    if (session) {
      await session.endSession();
    }
  }
});
module.exports = router;