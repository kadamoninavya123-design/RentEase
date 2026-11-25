
const express = require("express");
const mongoose = require("mongoose");

const Rental = require("../models/Rental");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Restore reserved stock if order creation fails
async function restoreStock(reservedProducts) {
  for (const item of reservedProducts) {
    await Product.updateOne(
      { _id: item.productId },
      {
        $inc: { stockQuantity: item.quantity },
        $set: { available: true }
      }
    );
  }
}

// Create a rental order
router.post("/", protect, async (req, res) => {
  const reservedProducts = [];

  try {
    const { items, deliveryAddress, deliveryDate } = req.body;

    // Validate request
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your rental cart is empty."
      });
    }

    if (
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required."
      });
    }

    if (!deliveryDate || isNaN(Date.parse(deliveryDate))) {
      return res.status(400).json({
        success: false,
        message: "A valid delivery date is required."
      });
    }

    const selectedDate = new Date(deliveryDate);

    if (selectedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Delivery date must be in the future."
      });
    }

    const rentalItems = [];
    const productCache = new Map();
    const requestedQuantities = new Map();

    let monthlyTotal = 0;
    let depositTotal = 0;

    // Validate products and calculate order totals
    for (const item of items) {
      const { productId, rentalTenure, quantity = 1 } = item;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID."
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity."
        });
      }

      const tenure = Number(rentalTenure);

      if (!Number.isInteger(tenure)) {
        return res.status(400).json({
          success: false,
          message: "Invalid rental duration."
        });
      }

      let product = productCache.get(productId);

      if (!product) {
        product = await Product.findById(productId);

        if (!product || !product.available) {
          return res.status(400).json({
            success: false,
            message: "A selected product is unavailable."
          });
        }

        productCache.set(productId, product);
      }

      if (!product.rentalTenures.includes(tenure)) {
        return res.status(400).json({
          success: false,
          message: `Invalid rental duration for ${product.name}.`
        });
      }

      // Add quantities together for products appearing
      // multiple times in the cart
      const currentQuantity =
        requestedQuantities.get(productId) || 0;

      requestedQuantities.set(
        productId,
        currentQuantity + quantity
      );

      rentalItems.push({
        product: product._id,
        productName: product.name,
        monthlyPrice: product.price,
        securityDeposit: product.securityDeposit || 0,
        rentalTenure: tenure,
        quantity
      });

      monthlyTotal += product.price * quantity;

      depositTotal +=
        (product.securityDeposit || 0) * quantity;
    }

    // Check combined quantities against available stock
    for (const [productId, quantity] of requestedQuantities) {
      const product = productCache.get(productId);

      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockQuantity} units of ${product.name} are available.`
        });
      }
    }

    // Reserve stock using atomic database updates
    for (const [productId, quantity] of requestedQuantities) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          available: true,
          stockQuantity: { $gte: quantity }
        },
        {
          $inc: { stockQuantity: -quantity }
        },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(
          `Stock changed while placing your order. Please try again.`
        );
      }

      // Record reservation so it can be restored if needed
      reservedProducts.push({
        productId,
        quantity
      });

      // Mark product unavailable when stock reaches zero
      if (updatedProduct.stockQuantity === 0) {
        await Product.updateOne(
          { _id: productId },
          { $set: { available: false } }
        );
      }
    }

    // Calculate total rent for the selected durations
    const rentalTotal = rentalItems.reduce(
      (total, item) =>
        total +
        item.monthlyPrice * item.rentalTenure * item.quantity,
      0
    );

    // Save rental order
    const rental = await Rental.create({
      customer: req.user._id,
      items: rentalItems,
      deliveryAddress: deliveryAddress.trim(),
      deliveryDate: selectedDate,
      monthlyTotal,
      depositTotal,
      rentalTotal,
      status: "Pending"
    });

    return res.status(201).json({
      success: true,
      message: "Rental order created successfully. Stock has been updated.",
      rental
    });

  } catch (error) {
    console.error("Rental creation error:", error);

    // Restore stock if the order could not be created
    try {
      await restoreStock(reservedProducts);
    } catch (restoreError) {
      console.error("Stock restoration error:", restoreError);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create rental order."
    });
  }
});

// Get logged-in customer's rental history
router.get("/my-rentals", protect, async (req, res) => {
  try {
    const rentals = await Rental.find({
      customer: req.user._id
    }).populate("items.product", "name category icon");

    return res.status(200).json({
      success: true,
      rentals
    });

  } catch (error) {
    console.error("Rental fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your rentals."
    });
  }
});

// Cancel a pending rental and restore stock
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental order ID."
      });
    }

    // Only the customer who owns the order can cancel it
    // Only pending orders can be cancelled
    const rental = await Rental.findOneAndUpdate(
      {
        _id: id,
        customer: req.user._id,
        status: "Pending"
      },
      {
        $set: { status: "Cancelled" }
      },
      { new: true }
    );

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Pending rental order not found or already cancelled."
      });
    }

    // Restore stock for all items in the cancelled order
    const quantities = new Map();

    for (const item of rental.items) {
      const productId = item.product.toString();

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + item.quantity
      );
    }

    for (const [productId, quantity] of quantities) {
      await Product.updateOne(
        { _id: productId },
        {
          $inc: { stockQuantity: quantity },
          $set: { available: true }
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Rental cancelled and product stock restored.",
      rental
    });

  } catch (error) {
    console.error("Rental cancellation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel rental order."
    });
  }
});

module.exports = router;
