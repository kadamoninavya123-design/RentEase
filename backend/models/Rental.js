
const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        productName: {
          type: String,
          required: true
        },
        monthlyPrice: {
          type: Number,
          required: true,
          min: 0
        },
        securityDeposit: {
          type: Number,
          required: true,
          min: 0
        },
        rentalTenure: {
          type: Number,
          enum: [3, 6, 12],
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        }
      }
    ],

    deliveryAddress: {
      type: String,
      required: true,
      trim: true
    },

    deliveryDate: {
      type: Date,
      required: true
    },

    // Delivery tracking
    deliveryStatus: {
      type: String,
      enum: ["Scheduled", "Dispatched", "Delivered"],
      default: "Scheduled"
    },

    actualDeliveryDate: {
      type: Date,
      default: null
    },

    // Pickup tracking
    scheduledPickupDate: {
      type: Date,
      default: null
    },

    pickupStatus: {
      type: String,
      enum: ["Not Scheduled", "Scheduled", "Picked Up"],
      default: "Not Scheduled"
    },

    actualPickupDate: {
      type: Date,
      default: null
    },

    // Inventory restoration tracking
    stockRestored: {
      type: Boolean,
      default: false
    },

    stockRestoredAt: {
      type: Date,
      default: null
    },

    // Return inspection tracking
    returnStatus: {
      type: String,
      enum: [
        "Not Returned",
        "Return Scheduled",
        "Returned",
        "Under Inspection",
        "Inspected"
      ],
      default: "Not Returned"
    },

    returnCondition: {
      type: String,
      enum: [
        "Not Inspected",
        "Good",
        "Minor Damage",
        "Major Damage",
        "Missing Parts"
      ],
      default: "Not Inspected"
    },

    actualReturnDate: {
      type: Date,
      default: null
    },

    returnNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },

    monthlyTotal: {
      type: Number,
      required: true
    },

    depositTotal: {
      type: Number,
      required: true
    },

    rentalTotal: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Delivered",
        "Active",
        "Completed",
        "Cancelled"
      ],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
