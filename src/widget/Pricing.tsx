import React from 'react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '€0',
      period: 'forever',
      features: [
        '3 room presets',
        'Basic artwork selection',
        'Share links',
        'Standard support'
      ],
      cta: 'Current Plan',
      highlighted: false
    },
    {
      name: 'Designer Pro',
      price: '€29',
      period: 'month',
      features: [
        'Everything in Free',
        'Custom room upload',
        'Scale calibration',
        'Client PDF exports',
        'Priority support',
        'No watermarks'
      ],
      cta: 'Upgrade to Pro',
      highlighted: true
    },
    {
      name: 'Studio',
      price: '€99',
      period: 'month',
      features: [
        'Everything in Pro',
        'White label widget',
        'Custom branding',
        'Analytics dashboard',
        'Affiliate program',
        'API access'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h2>
        <p className="text-gray-600">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`rounded-xl p-8 ${
              plan.highlighted
                ? 'bg-primary text-white shadow-2xl scale-105 border-4 border-primary'
                : 'bg-surface border-2 border-gray-200'
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className={`text-sm ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
                /{plan.period}
              </span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <svg 
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.highlighted ? 'text-white' : 'text-success'
                    }`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                plan.highlighted
                  ? 'bg-white text-primary hover:bg-gray-100'
                  : 'bg-primary text-white hover:opacity-90'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
