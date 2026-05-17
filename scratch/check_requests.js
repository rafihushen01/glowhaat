const mongoose = require("mongoose");

const MONGO_URL = "mongodb+srv://glowhaat_db_user:glowhaat12345@cluster0.zwmaoms.mongodb.net/";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB Connected!");

    // Load models
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const SellerRequest = mongoose.model("SellerRequest", new mongoose.Schema({}, { strict: false }));

    const reqs = await SellerRequest.find({}).lean();
    console.log(`Found ${reqs.length} total seller requests:`);
    for (const r of reqs) {
      console.log(`- Request ID: ${r._id}`);
      console.log(`  Name: ${r.fullname}`);
      console.log(`  Email: ${r.email}`);
      console.log(`  Seller Login Email: ${r.sellerloginemail}`);
      console.log(`  Password Hash Length: ${r.sellerpasswordhash ? r.sellerpasswordhash.length : "N/A"}`);
      console.log(`  Mobile: ${r.mobile}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Reject Reason: ${r.rejectreason}`);

      const email = r.sellerloginemail || r.email;
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() }).lean();
      console.log(`  Existing User by Email? ${existingUser ? "YES" : "NO"}`);
      if (existingUser) {
        console.log(`  - User Details: ID=${existingUser._id}, Role=${existingUser.role}, IsSellerVerified=${existingUser.issellerverified}`);
      }

      if (r.mobile) {
        const existingMobile = await User.findOne({ mobile: r.mobile.trim() }).lean();
        console.log(`  Existing User by Mobile? ${existingMobile ? "YES" : "NO"}`);
        if (existingMobile) {
          console.log(`  - Mobile User Details: ID=${existingMobile._id}, Role=${existingMobile.role}`);
        }
      }
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Error running script:", error);
    mongoose.disconnect();
  }
};

run();
