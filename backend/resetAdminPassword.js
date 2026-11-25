
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "kadamoninavya123@gmail.com";

    // Choose a new password here
    const newPassword = "Navya@123";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email, role: "admin" },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      console.log("Admin account not found.");
      return;
    }

    console.log("Admin password reset successfully!");
  } catch (error) {
    console.error("Password reset failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();
