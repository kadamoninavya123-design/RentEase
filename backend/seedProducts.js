
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  {
    name: "Modern Sofa",
    category: "Furniture",
    price: 899,
    securityDeposit: 2000,
    rentalTenures: [3, 6, 12],
    icon: "🛋️",
    imageUrl: "",
    description:
      "Comfortable modern sofa suitable for apartments and family living rooms.",
    stockQuantity: 10,
    available: true
  },
  {
    name: "Queen Size Bed",
    category: "Furniture",
    price: 699,
    securityDeposit: 1500,
    rentalTenures: [3, 6, 12],
    icon: "🛏️",
    imageUrl: "",
    description:
      "Spacious queen size bed designed for comfortable everyday use.",
    stockQuantity: 8,
    available: true
  },
  {
    name: "Refrigerator",
    category: "Appliances",
    price: 999,
    securityDeposit: 2500,
    rentalTenures: [3, 6, 12],
    icon: "🧊",
    imageUrl: "",
    description:
      "Energy-efficient refrigerator suitable for everyday household storage.",
    stockQuantity: 7,
    available: true
  },
  {
    name: "Washing Machine",
    category: "Appliances",
    price: 799,
    securityDeposit: 2000,
    rentalTenures: [3, 6, 12],
    icon: "🧺",
    imageUrl: "",
    description:
      "Easy-to-use washing machine for convenient household laundry.",
    stockQuantity: 6,
    available: true
  },
  {
    name: "Study Table",
    category: "Furniture",
    price: 299,
    securityDeposit: 500,
    rentalTenures: [3, 6, 12],
    icon: "🪑",
    imageUrl: "",
    description:
      "Compact study table suitable for students and work-from-home setups.",
    stockQuantity: 12,
    available: true
  },
  {
    name: "Smart Television",
    category: "Appliances",
    price: 599,
    securityDeposit: 1500,
    rentalTenures: [3, 6, 12],
    icon: "📺",
    imageUrl: "",
    description:
      "Smart television for entertainment and streaming at home.",
    stockQuantity: 5,
    available: true
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    for (const product of products) {
      await Product.findOneAndUpdate(
        { name: product.name },
        { $set: product },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      console.log(`${product.name} updated successfully`);
    }

    console.log("All products updated successfully!");

  } catch (error) {
    console.error("Product update error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
