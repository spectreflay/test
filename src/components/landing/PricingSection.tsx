import React from 'react';
import { Check } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: 'Free',
      price: 0,
      features: [
        '1 Store',
        'Up to 10 Products',
        '2 Staff Members',
        'Basic Reports',
        'Basic Inventory Management'
      ]
    },
    {
      name: 'Basic',
      price: 29,
      features: [
        'Up to 2 Stores',
        'Up to 100 Products',
        '5 Staff Members',
        'Advanced Reports',
        'Inventory Alerts',
        'Email Support'
      ]
    },
    {
      name: 'Premium',
      price: 99,
      features: [
        'Unlimited Stores',
        'Unlimited Products',
        'Unlimited Staff',
        'Advanced Analytics',
        'Custom Roles',
        'Priority Support',
        'API Access'
      ]
    }
  ];

  return (
    <section className="py-20 bg-gray-50" id='pricing'>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that best fits your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-8 w-full bg-primary text-white rounded-md py-2 hover:bg-primary-hover transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;