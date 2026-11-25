
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Product = require("./models/Product");

const authRoutes = require("./routes/authRoutes");
const rentalRoutes = require("./routes/rentalRoutes");
const adminRoutes = require("./routes/adminRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const adminMaintenanceRoutes = require("./routes/adminMaintenanceRoutes");
const damageClaimRoutes = require("./routes/damageClaimRoutes");
const adminDamageClaimRoutes = require("./routes/adminDamageClaimRoutes");
const adminReturnRoutes = require("./routes/adminReturnRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// ROUTE DIAGNOSTICS
// ========================================

console.log("\n========== ROUTE CHECK ==========");

console.log("authRoutes:", typeof authRoutes);
console.log("rentalRoutes:", typeof rentalRoutes);
console.log("adminRoutes:", typeof adminRoutes);
console.log("maintenanceRoutes:", typeof maintenanceRoutes);
console.log("adminMaintenanceRoutes:", typeof adminMaintenanceRoutes);
console.log("damageClaimRoutes:", typeof damageClaimRoutes);
console.log("adminDamageClaimRoutes:", typeof adminDamageClaimRoutes);
console.log("adminReturnRoutes:", typeof adminReturnRoutes);

console.log("=================================\n");

// Middleware
app.use(cors());
app.use(express.json());

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/rentals", rentalRoutes);

app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/admin/maintenance", adminMaintenanceRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/damage-claims", damageClaimRoutes);
app.use("/api/admin/damage-claims", adminDamageClaimRoutes);
app.use("/api/admin/returns", adminReturnRoutes);

// ========================================
// WELCOME ROUTE
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to RentEase API!",
    status: "Server is running successfully"
  });
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "RentEase backend is healthy",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

// ========================================
// GET ALL AVAILABLE PRODUCTS
// ========================================

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({
      available: true
    }).sort({ createdAt: 1 });

    res.status(200).json(products);

  } catch (error) {
    console.error("Error fetching products:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch products"
    });
  }
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from backend/.env");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `RentEase server running at http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
}

startServer();
