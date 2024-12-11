import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="flex flex-col-reverse lg:flex-row max-w-7xl mx-auto">
        {/* Info Section */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:py-20">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Modern POS System for</span>
              <span className="block text-primary">Modern Businesses</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 sm:mt-6 sm:text-xl sm:max-w-lg lg:max-w-md lg:mt-8">
              Transform your business with our powerful, cloud-based point of sale system. 
              Manage inventory, track sales, and grow your business with ease.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
              <Link
                to="/register"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-hover transition md:py-4 md:text-lg md:px-10"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-indigo-100 hover:bg-indigo-200 transition md:py-4 md:text-lg md:px-10"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="flex-1 mb-20 px-8 md:pr-8">
          <img
            className="w-full h-64 object-cover sm:h-80 md:h-96 lg:h-full"
            src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
            alt="Point of Sale System"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
