import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testimonials } from '../../data/testimonials';

const Testimonials = () => {
  const [currentTestimonials, setCurrentTestimonials] = useState(testimonials.slice(0, 3));
  const [autoplay, setAutoplay] = useState(true);

  // Rotate testimonials every 8 seconds
  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      const nextIndex = testimonials.findIndex(t => t.id === currentTestimonials[0].id) + 1;
      const startIndex = nextIndex % testimonials.length;
      setCurrentTestimonials(
        [...testimonials, ...testimonials].slice(startIndex, startIndex + 3)
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [currentTestimonials, autoplay]);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-poppins font-bold mb-4">What Our Community Says</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Hear from donors, campaign creators, and beneficiaries about their experience with Sahayog Nepal.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {currentTestimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.id}
                className="bg-gray-50 rounded-xl p-6 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setAutoplay(false)}
                onMouseLeave={() => setAutoplay(true)}
              >
                <div className="absolute -top-4 left-6 text-5xl text-primary-200">"</div>
                <div className="relative z-10">
                  <p className="text-gray-600 mb-6 pt-4">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="h-12 w-12 rounded-full object-cover mr-4" 
                    />
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
