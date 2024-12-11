import React from "react";
import { Link } from "react-router-dom";
import { Store, HelpCircle } from "lucide-react";
import FAQSection from "../components/faq/FAQSection";
import {
  generalFAQs,
  subscriptionFAQs,
  technicalFAQs,
} from "../components/faq/FAQData";

const FAQ = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
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

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <HelpCircle className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Find answers to common questions about IREGO POS System
            </p>
          </div>

          <div className="space-y-8">
            <FAQSection title="General Questions" faqs={generalFAQs} />
            <FAQSection
              title="Subscription & Billing"
              faqs={subscriptionFAQs}
            />
            <FAQSection title="Technical Support" faqs={technicalFAQs} />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Can't find what you're looking for?{" "}
              <Link
                to="/contact"
                className="text-primary hover:text-primary-hover"
              >
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
