import React from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Target,
  Users,
  Award,
  Rocket,
  Heart,
  Shield,
  Globe,
} from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description:
        "We put our customers at the heart of everything we do, ensuring their success is our success.",
    },
    {
      icon: Shield,
      title: "Reliability",
      description:
        "Our robust system ensures your business runs smoothly 24/7 with enterprise-grade security.",
    },
    {
      icon: Rocket,
      title: "Innovation",
      description:
        "We continuously evolve our platform with cutting-edge technology to stay ahead of market needs.",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description:
        "Making powerful business tools accessible to businesses of all sizes, anywhere in the world.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      description:
        "15+ years of retail technology experience, passionate about empowering small businesses.",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5",
      description:
        "Former Silicon Valley engineer bringing enterprise-level technology to everyday businesses.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      description:
        "Retail operations expert focused on creating intuitive and powerful business solutions.",
    },
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
        {/* Hero Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Empowering Businesses Worldwide
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
                IREGO POS was founded with a simple mission: to provide powerful,
                yet easy-to-use point of sale solutions that help businesses thrive
                in the digital age.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <Target className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-600">
              To revolutionize how businesses manage their operations by providing
              accessible, powerful, and intuitive point of sale solutions. We
              believe that every business, regardless of size, deserves access to
              enterprise-level tools that can help them grow and succeed.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            <p className="mt-4 text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 text-center"
              >
                <value.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
            </div>
            <p className="mt-4 text-xl text-gray-600">
              Meet the people behind IREGO POS
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Awards Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-8">
                <Award className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Recognition & Awards
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Best POS Solution 2023
                  </h3>
                  <p className="text-gray-600">
                    Retail Technology Innovation Awards
                  </p>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Top Cloud Solution
                  </h3>
                  <p className="text-gray-600">
                    Business Software Excellence Awards
                  </p>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Customer Choice Award
                  </h3>
                  <p className="text-gray-600">
                    Small Business Technology Awards
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;