const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

const MONGO_URL = "mongodb+srv://glowhaat_db_user:glowhaat12345@cluster0.zwmaoms.mongodb.net/";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB Connected!");

    // Load SellerController
    const SellerController = require(path.join(process.cwd(), "src/controllers/SellerController"));
    const User = require(path.join(process.cwd(), "src/models/User"));
    const SellerRequest = require(path.join(process.cwd(), "src/models/SellerRequest"));

    // Clean up
    await SellerRequest.deleteMany({ email: "test_seller2@glowhaat.com" });
    await User.deleteMany({ email: "test_seller2@glowhaat.com" });

    // Create a SuperAdmin user to mock request session
    let superAdmin = await User.findOne({ role: "SuperAdmin" });
    if (!superAdmin) {
      superAdmin = await User.create({
        fullname: "System Admin",
        email: "admin@glowhaat.com",
        password: await bcrypt.hash("AdminPassword123!", 12),
        role: "SuperAdmin",
        issellerverified: false,
      });
    }

    const sellerpasswordhash = await bcrypt.hash("Password123!", 12);

    console.log("Creating test pending request...");
    const reqDoc = await SellerRequest.create({
      fullname: "Test Seller 2",
      email: "test_seller2@glowhaat.com",
      mobile: "+8801700000005",
      whatsapp: "+8801700000005",
      dateofbirth: new Date("1995-01-01"),
      storetype: "Cosmetics",
      preferredcategories: ["Skincare"],
      businessname: "Test Shop 2",
      businessgmail: "test_seller2@glowhaat.com",
      sellerloginemail: "test_seller2@glowhaat.com",
      sellerpasswordhash,
      businessmodel: "Physical Store",
      pickup: {
        district: "Dhaka",
        city: "Dhaka",
        area: "Mirpur",
        addressline: "Road 1",
        deliverymanphone: "+8801700000001",
      },
      status: "Pending"
    });

    console.log(`Created request with ID: ${reqDoc._id}`);

    // Mock request and response
    const mockReq = {
      user: { userId: String(superAdmin._id) },
      params: { id: String(reqDoc._id) },
      body: { decision: "Approved", rejectreason: "" }
    };

    const mockRes = {
      status(code) {
        console.log(`[res.status] ${code}`);
        return this;
      },
      json(data) {
        console.log("[res.json]", data);
        return this;
      }
    };

    console.log("Calling decideSellerRequest controller...");
    await SellerController.decideSellerRequest(mockReq, mockRes);

    mongoose.disconnect();
  } catch (error) {
    console.error("Error executing approval logic:", error);
    mongoose.disconnect();
  }
};

run();
