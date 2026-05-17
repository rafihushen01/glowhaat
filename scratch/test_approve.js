const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URL = "mongodb+srv://glowhaat_db_user:glowhaat12345@cluster0.zwmaoms.mongodb.net/";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB Connected!");

    // Load models
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const SellerRequest = mongoose.model("SellerRequest", new mongoose.Schema({}, { strict: false }));

    // Delete any existing test request first
    await SellerRequest.deleteMany({ email: "test_seller@glowhaat.com" });
    await User.deleteMany({ email: "test_seller@glowhaat.com" });

    // Create a new password hash
    const sellerpasswordhash = await bcrypt.hash("Password123!", 12);

    console.log("Creating test pending request...");
    const req = await SellerRequest.create({
      fullname: "Test Seller",
      email: "test_seller@glowhaat.com",
      mobile: "+8801700000000",
      whatsapp: "+8801700000000",
      dateofbirth: new Date("1995-01-01"),
      storetype: "Cosmetics",
      preferredcategories: ["Skincare"],
      businessname: "Test Shop",
      businessgmail: "test_seller@glowhaat.com",
      sellerloginemail: "test_seller@glowhaat.com",
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

    console.log(`Created request with ID: ${req._id}`);

    // Now attempt to run the approve logic
    const requestid = req._id;
    const decision = "Approved";
    const rejectreason = "";

    console.log("Running approval logic...");

    const existing = await SellerRequest.findById(requestid);
    if (!existing) {
      console.log("Seller request not found.");
      mongoose.disconnect();
      return;
    }

    existing.status = decision;
    existing.rejectreason = decision === "Rejected" ? rejectreason : "";
    existing.reviewedby = null; // System dry-run
    existing.reviewedat = new Date();

    const sellerLoginEmail = (existing.sellerloginemail || existing.email).trim().toLowerCase();
    let linkedUser =
      (existing.userid && (await User.findById(existing.userid))) ||
      (await User.findOne({ email: sellerLoginEmail })) ||
      (await User.findOne({ email: existing.email }));

    if (decision === "Approved") {
      if (!linkedUser && !existing.sellerpasswordhash) {
        console.log("Seller password missing.");
        mongoose.disconnect();
        return;
      }

      if (!linkedUser) {
        const mobile = (existing.mobile || "").trim();
        if (mobile) {
          const mobileOwner = await User.findOne({ mobile }).select("_id mobile").lean();
          if (mobileOwner) {
            console.log("Error: Mobile number already used.");
            mongoose.disconnect();
            return;
          }
        }

        console.log("Creating new User document...");
        linkedUser = await User.create({
          fullname: existing.fullname || "Seller",
          email: sellerLoginEmail,
          password: existing.sellerpasswordhash,
          mobile: mobile || undefined,
          gender: "Other",
          role: "Seller",
          issellerverified: true,
          sellerapprovedat: new Date(),
        });
        console.log(`Created new User: ID=${linkedUser._id}`);
      } else {
        console.log("Updating existing User document...");
        linkedUser.email = sellerLoginEmail || linkedUser.email;
        if (existing.sellerpasswordhash) linkedUser.password = existing.sellerpasswordhash;
        linkedUser.role = "Seller";
        linkedUser.issellerverified = true;
        linkedUser.sellerapprovedat = new Date();
        await linkedUser.save();
        console.log(`Updated User: ID=${linkedUser._id}`);
      }

      existing.userid = linkedUser._id;
    }

    await existing.save();
    console.log("Approval logic executed successfully!");

    mongoose.disconnect();
  } catch (error) {
    console.error("Error executing approval logic:", error);
    mongoose.disconnect();
  }
};

run();
