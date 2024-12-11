import React from "react";
import FAQItem from "./FAQItem";
import { FAQ } from "./Types";

interface FAQSectionProps {
  title: string;
  faqs: FAQ[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ title, faqs }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
