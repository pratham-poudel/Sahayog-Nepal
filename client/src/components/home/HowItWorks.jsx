import { Link } from 'wouter';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const steps = [
    {
      icon: 'ri-flag-line',
      title: 'Start a Campaign',
      description: 'Create your fundraising campaign in minutes. Share your story, set a goal, and upload photos.',
      iconBg: 'bg-[#8B2325]/10',
      iconColor: 'text-[#8B2325]',
      stepNumber: '01'
    },
    {
      icon: 'ri-share-line',
      title: 'Share with Network',
      description: 'Spread the word through social media, messaging, and email to reach potential supporters.',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      stepNumber: '02'
    },
    {
      icon: 'ri-coins-line',
      title: 'Collect Donations',
      description: 'Receive funds directly to your account. Track progress and thank your donors.',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      stepNumber: '03'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-poppins font-bold mb-4 text-gray-900 dark:text-white">How Sahayog Nepal Works</h2>
          <div className="w-16 h-1 bg-[#8B2325] dark:bg-amber-500 rounded-full mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Our platform makes it easy to start or support campaigns that matter to you and your community.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start mb-4">
                <div className={`flex-shrink-0 ${step.iconBg} rounded-lg p-3 mr-4`}>
                  <i className={`${step.icon} text-2xl ${step.iconColor}`}></i>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{step.stepNumber}</div>
                  <h3 className="font-poppins font-bold text-xl mb-2 text-gray-900 dark:text-white">{step.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 pl-14">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 border-t border-b border-gray-200 dark:border-gray-700 py-6 px-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Ready to make a difference?</span>
            <Link to="/start-campaign">
              <button 
                className="py-3 px-6 bg-[#8B2325] text-white font-medium rounded-lg hover:bg-[#7a1f21] transition-colors"
              >
                Start Your Campaign
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
