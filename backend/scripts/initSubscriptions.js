import mongoose from "mongoose";
import Subscription from "../models/subscriptionModel.js";
import dotenv from "dotenv";

dotenv.config();

const subscriptionData = [
  {
    name: "free",
    features: ["basic_reports", "basic_inventory"],
    maxProducts: 10,
    maxStaff: 2,
    maxStores: 1,
    price: 0,
    billingCycle: "monthly",
  },
  {
    name: "basic",
    features: ["unlimited_products", "inventory_alerts", "advanced_reports"],
    maxProducts: 100,
    maxStaff: 5,
    maxStores: 2,
    price: 29,
    billingCycle: "monthly",
  },
  {
    name: "premium",
    features: [
      "unlimited_products",
      "unlimited_staff",
      "advanced_reports",
      "inventory_alerts",
      "multiple_stores",
      "custom_roles",
      "api_access",
      "priority_support",
    ],
    maxProducts: 999999,
    maxStaff: 999999,
    maxStores: 999999,
    price: 99,
    billingCycle: "monthly",
  },
];
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      return;
    }

    await mongoose.connect(
      "mongodb+srv://admin:admin@pos-remaster.2f4tp.mongodb.net",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};
const initSubscriptions = async () => {
  try {
    await connectDB();

    await Subscription.deleteMany({});
    await Subscription.insertMany(subscriptionData);

    console.log("Subscription plans initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
    process.exit(1);
  }
};

initSubscriptions();
