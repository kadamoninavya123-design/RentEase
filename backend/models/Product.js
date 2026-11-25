
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Product name
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Product category
    category: {
      type: String,
      required: true,
      enum: ["Furniture", "Appliances"]
    },

    // Monthly rental price (existing field preserved)
    price: {
      type: Number,
      required: true,
      min: 0
    },

    // Refundable security deposit
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0
    },

    // Available rental durations in months
    rentalTenures: {
      type: [Number],
      enum: [1, 3, 6, 12],
      default: [3, 6, 12],
      validate: {
        validator: function (values) {
          return values.length > 0;
        },
        message: "At least one rental tenure is required."
      }
    },

    // Product icon
    icon: {
      type: String,
      default: "🏠"
    },

    // Product image URL
    imageUrl: {
      type: String,
      default: ""
    },

    // Product description
    description: {
      type: String,
      required: true,
      trim: true
    },

    // Total inventory quantity
    stockQuantity: {
      type: Number,
      default: 1,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock quantity must be a whole number."
      }
    },

    // Product availability
    available: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
