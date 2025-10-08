import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const InspirationQuote = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  
  const quotes = [
    {
      text: "No act of kindness, no matter how small, is ever wasted.",
      author: "Aesop",
      context: "Ancient wisdom that guides us still"
    },
    {
      text: "We rise by lifting others.",
      author: "Robert Ingersoll",
      context: "The heart of community"
    },
    {
      text: "The best way to find yourself is to lose yourself in the service of others.",
      author: "Mahatma Gandhi",
      context: "A path to purpose"
    },
    {
      text: "Alone we can do so little; together we can do so much.",
      author: "Helen Keller",
      context: "The power of unity"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 8000); // Change quote every 8 seconds

    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Soft background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#8B2325]/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Decorative element */}
            <div className="flex justify-center mb-6">
              <svg width="60" height="45" viewBox="0 0 60 45" fill="none" className="text-[#8B2325]/20 dark:text-red-400/20">
                <path d="M13.5 0C6.04 0 0 6.04 0 13.5c0 7.46 6.04 13.5 13.5 13.5 1.82 0 3.56-.36 5.13-.99L13.5 45V27c-7.46 0-13.5-6.04-13.5-13.5S6.04 0 13.5 0zm33 0C39.04 0 33 6.04 33 13.5c0 7.46 6.04 13.5 13.5 13.5 1.82 0 3.56-.36 5.13-.99L46.5 45V27c-7.46 0-13.5-6.04-13.5-13.5S39.04 0 46.5 0z" fill="currentColor"/>
              </svg>
            </div>

            {/* Quote content with animation */}
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <p className="text-2xl md:text-3xl lg:text-4xl text-gray-800 dark:text-gray-100 mb-6 leading-relaxed text-quote px-4">
                "{quotes[currentQuote].text}"
              </p>
              
              <div className="space-y-2">
                <p className="text-lg md:text-xl font-semibold text-[#8B2325] dark:text-red-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  — {quotes[currentQuote].author}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {quotes[currentQuote].context}
                </p>
              </div>
            </motion.div>

            {/* Quote navigation dots */}
            <div className="flex justify-center gap-2 mt-8">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuote(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentQuote 
                      ? 'w-8 h-2 bg-[#8B2325] dark:bg-red-400' 
                      : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`View quote ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InspirationQuote;
