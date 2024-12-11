import React from "react";
import { Link } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  BarChart2,
  Users,
  Package,
  Bell,
  Shield,
  Clock,
  Smartphone,
  Cloud,
  Settings,
  CreditCard,
} from "lucide-react";
import SEO from "../components/SEO";
import Hero from "../components/landing/Hero";
import FeatureCard from "../components/landing/FeatureCard";
import PricingSection from "../components/landing/PricingSection";
import TestimonialSection from "../components/landing/TestemonialSection";
import Footer from "../components/landing/Footer";

const LandingPage = () => {
  const features = [
    {
      icon: Store,
      title: "Multi-Store Management",
      description: "Manage multiple stores from a single dashboard with ease",
    },
    {
      icon: ShoppingCart,
      title: "Smart POS",
      description:
        "Fast and intuitive point of sale with support for multiple payment methods",
    },
    {
      icon: Package,
      title: "Inventory Management",
      description:
        "Real-time inventory tracking with automatic alerts and reordering",
    },
    {
      icon: BarChart2,
      title: "Advanced Analytics",
      description: "Detailed reports and insights to grow your business",
    },
    {
      icon: Users,
      title: "Staff Management",
      description: "Manage staff roles, permissions, and track performance",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay updated with real-time alerts and notifications",
    },
    {
      icon: Shield,
      title: "Secure System",
      description: "Enterprise-grade security to protect your business data",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock customer support for your business needs",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Access your POS system from any device, anywhere",
    },
    {
      icon: Cloud,
      title: "Cloud-Based",
      description: "No installation required, always up-to-date",
    },
    {
      icon: CreditCard,
      title: "Multiple Payment Options",
      description:
        "Accept various payment methods including cards, QR, and e-wallets",
    },
    {
      icon: Settings,
      title: "Customizable",
      description: "Tailor the system to your specific business needs",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO />
      <nav className="bg-white shadow-sm mb-20">
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

      <Hero />

      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need to Run Your Business
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful features to help you manage and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <TestimonialSection />

      <Footer />
    </div>
  );
};

export default LandingPage;
