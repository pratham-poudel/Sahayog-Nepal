import { useEffect } from 'react';
import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';

// Components
import Hero from '../components/home/Hero';
import Stats from '../components/home/Stats';
import InspirationQuote from '../components/home/InspirationQuote';
import FeaturedCampaigns from '../components/home/FeaturedCampaigns';
import TopDonors from '../components/home/TopDonors';
import HowItWorks from '../components/home/HowItWorks';
import CampaignCTA from '../components/home/CampaignCTA';
import Newsletter from '../components/home/Newsletter';

const Home = () => {
  // Fade in animation for sections
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  useEffect(() => {
    // Ensure the page starts at the top on load
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO 
        title="Home" 
        description="Every dream deserves a chance to grow. From the hills of Pokhara to the valleys of Kathmandu, your kindness can change a life today. Join Nepal's most trusted community of givers."
        keywords="help Nepal, support causes Nepal, crowdfunding Nepal, donate Nepal, community support, kindness, change lives"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Hero />
        <InspirationQuote />
        <Stats />
        <FeaturedCampaigns />
        <HowItWorks />
        <TopDonors />
        <CampaignCTA />
        <Newsletter />
      </motion.div>
    </>
  );
};

export default Home;
