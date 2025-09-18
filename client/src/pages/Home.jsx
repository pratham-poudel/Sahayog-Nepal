import { useEffect } from 'react';
import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';

// Components
import Hero from '../components/home/Hero';
import Stats from '../components/home/Stats';
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
        description="Join Nepal's first donation platform to support causes that matter. Together, we can make a difference in communities across Nepal."
        keywords="donation Nepal, crowdfunding Nepal, fundraising Nepal, community support, Nepal charity"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Hero />
        <Stats />
        <FeaturedCampaigns />
        <TopDonors />
        <HowItWorks />
        <CampaignCTA />
        <Newsletter />
      </motion.div>
    </>
  );
};

export default Home;
