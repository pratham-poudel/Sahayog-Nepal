import { motion } from 'framer-motion';

const Progress = ({ value }) => {
  return (
    <div className="progress-bar">
      <motion.div 
        className="progress-value"
        initial={{ width: '0%' }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      ></motion.div>
    </div>
  );
};

export default Progress;
