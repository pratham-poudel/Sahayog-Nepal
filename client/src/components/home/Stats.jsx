import { motion } from 'framer-motion';
import { stats } from '../../data/stats';

const Stats = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="p-6 rounded-xl bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
