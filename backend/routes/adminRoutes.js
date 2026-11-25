
const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Rental = require("../models/Rental");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

// ========================================
// GET ADMIN DASHBOARD
// GET /api/admin/dashboard
// ========================================

router.get("/dashboard", async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({
      role: "customer"
    });

    const totalProducts = await Product.countDocuments();

    const totalRentals = await Rental.countDocuments();

    const pendingRentals = await Rental.countDocuments({
      status: "Pending"
    });

    const activeRentals = await Rental.countDocuments({
      status: { $in: ["Confirmed", "Delivered", "Active"] }
    });

    const completedRentals = await Rental.countDocuments({
      status: "Completed"
    });

    const cancelledRentals = await Rental.countDocuments({
      status: "Cancelled"
    });

    const activeRevenue = await Rental.aggregate([
      {
        $match: {
          status: { $in: ["Confirmed", "Delivered", "Active"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$monthlyTotal" }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        totalCustomers,
        totalProducts,
        totalRentals,
        pendingRentals,
        activeRentals,
        completedRentals,
        cancelledRentals,
        monthlyRentalRevenue: activeRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard data."
    });
  }
});

// ========================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// ========================================

router.get("/customers", async (req, res) => {
  try {
    const customers = await User.find({
      role: "customer"
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalCustomers: customers.length,
      customers
    });
  } catch (error) {
    console.error("Admin customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers."
    });
  }
});

// ========================================
// GET ALL PRODUCTS
// GET /api/admin/products
// ========================================

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: 1
    });

    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error("Admin products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products."
    });
  }
});

// ========================================
// CREATE PRODUCT
// POST /api/admin/products
// ========================================

router.post("/products", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      securityDeposit,
      rentalTenures,
      icon,
      imageUrl,
      description,
      stockQuantity
    } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      !["Furniture", "Appliances"].includes(category) ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isInteger(Number(stockQuantity)) ||
      Number(stockQuantity) < 0 ||
      !Array.isArray(rentalTenures) ||
      rentalTenures.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid product details."
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      price: Number(price),
      securityDeposit: Number(securityDeposit) || 0,
      rentalTenures,
      icon: icon || "🏠",
      imageUrl: imageUrl || "",
      description: description.trim(),
      stockQuantity: Number(stockQuantity),
      available: Number(stockQuantity) > 0
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create product."
    });
  }
});

// ========================================
// UPDATE PRODUCT
// PUT /api/admin/products/:id
// ========================================

router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID."
      });
    }

    const allowedFields = [
      "name",
      "category",
      "price",
      "securityDeposit",
      "rentalTenures",
      "icon",
      "imageUrl",
      "description",
      "stockQuantity"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.securityDeposit !== undefined) {
      updates.securityDeposit = Number(updates.securityDeposit);
    }

    if (updates.stockQuantity !== undefined) {
      updates.stockQuantity = Number(updates.stockQuantity);
    }

    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.stockQuantity !== undefined) {
      updates.available = updates.stockQuantity > 0;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update product."
    });
  }
});

// ========================================
// UPDATE PRODUCT AVAILABILITY
// PATCH /api/admin/products/:id/availability
// ========================================

router.patch("/products/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID."
      });
    }

    if (typeof available !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Availability must be true or false."
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { available } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product availability updated.",
      product
    });
  } catch (error) {
    console.error("Product availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update product availability."
    });
  }
});

// ========================================
// DELETE PRODUCT
// DELETE /api/admin/products/:id
// ========================================

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID."
      });
    }

    // Preserve products referenced by rental history
    const referenced = await Rental.exists({
      "items.product": id
    });

    if (referenced) {
      return res.status(409).json({
        success: false,
        message: "This product is linked to rental history and cannot be deleted."
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully."
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete product."
    });
  }
});

// ========================================
// GET ALL RENTAL ORDERS
// GET /api/admin/rentals
// ========================================

router.get("/rentals", async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate("customer", "name email")
      .populate("items.product", "name category icon")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      rentals
    });
  } catch (error) {
    console.error("Admin rentals error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch rental orders."
    });
  }
});

// ========================================
// UPDATE RENTAL ORDER STATUS
// PATCH /api/admin/rentals/:id/status
// ========================================

router.patch("/rentals/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Delivered",
      "Active",
      "Completed",
      "Cancelled"
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental ID."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental status."
      });
    }

    const rental = await Rental.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate("customer", "name email")
      .populate("items.product", "name category icon");

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "Rental order not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rental status updated successfully.",
      rental
    });
  } catch (error) {
    console.error("Rental status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update rental status."
    });
  }
});

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
