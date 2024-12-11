import React from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Book,
  FileText,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  Tag,
  Bell,
  Shield,
  Clock,
  Smartphone,
  Cloud,
  Settings,
} from "lucide-react";

const Documentation = () => {
  const features = [
    {
      title: "Sales Management",
      icon: ShoppingCart,
      items: [
        "Process sales with an intuitive POS interface",
        "Support for multiple payment methods (Cash, Card, QR)",
        "Apply discounts and modifiers to items",
        "Quick product search and category filtering",
        "Real-time stock updates on sales",
        "Print or email receipts",
        "View sales history and process refunds"
      ]
    },
    {
      title: "Inventory Control",
      icon: Package,
      items: [
        "Track product stock levels in real-time",
        "Set up automatic stock alerts",
        "Manage product categories and variants",
        "Add product modifiers and options",
        "Record stock movements and adjustments",
        "View stock movement history",
        "Set reorder points and low stock thresholds"
      ]
    },
    {
      title: "Staff Management",
      icon: Users,
      items: [
        "Create and manage staff accounts",
        "Define custom roles and permissions",
        "Track staff activity and sales performance",
        "Set up role-based access control",
        "Monitor staff login history",
        "Manage staff schedules and shifts",
        "Control feature access by role"
      ]
    },
    {
      title: "Reports & Analytics",
      icon: BarChart2,
      items: [
        "View daily, weekly, and monthly sales reports",
        "Track revenue and profit margins",
        "Analyze sales by payment method",
        "Monitor top-selling products",
        "Generate inventory reports",
        "Export data to Excel",
        "Custom date range reporting"
      ]
    },
    {
      title: "Discount Management",
      icon: Tag,
      items: [
        "Create percentage or fixed amount discounts",
        "Set up time-limited promotions",
        "Apply discounts to specific products",
        "Define minimum purchase requirements",
        "Track discount usage and impact",
        "Schedule automatic discounts",
        "Set maximum discount limits"
      ]
    },
    {
      title: "Multi-store Management",
      icon: Store,
      items: [
        "Manage multiple store locations",
        "Track inventory across stores",
        "View per-store sales and reports",
        "Configure store-specific settings",
        "Manage staff across locations",
        "Set store-specific pricing",
        "Monitor performance by location"
      ]
    }
  ];

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link to={"/"} className="flex items-center">
              <Store className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                IREGO POS
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <Book className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              POS System Features
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Comprehensive guide to our point of sale system's features and capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">{feature.title}</h2>
                </div>
                <ul className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <div className="min-w-[6px] h-[6px] rounded-full bg-primary mt-2" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Getting Started</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Create Your Account</h3>
                <p className="text-gray-600">
                  Sign up for a free account to access basic features. Choose from our
                  flexible subscription plans as your business grows.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">2. Set Up Your Store</h3>
                <p className="text-gray-600">
                  Configure your store details, add your products, and customize
                  settings to match your business needs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3. Add Your Team</h3>
                <p className="text-gray-600">
                  Create staff accounts and assign roles with specific permissions
                  to manage access to different features.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">4. Start Selling</h3>
                <p className="text-gray-600">
                  Begin processing sales, tracking inventory, and growing your
                  business with our comprehensive POS solution.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Need help getting started?{" "}
              <Link to="/contact" className="text-primary hover:text-primary-hover">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Documentation;