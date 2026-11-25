
const mongoose = require("mongoose");

const damageClaimSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    productName: {
      type: String,
      required: true,
      trim: true
    },

    claimType: {
      type: String,
      enum: [
        "Product Damage",
        "Missing Parts",
        "Delivery Damage",
        "Other"
      ],
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "Approved",
        "Rejected",
        "Resolved"
      ],
      default: "Pending"
    },

    adminNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DamageClaim", damageClaimSchema);
