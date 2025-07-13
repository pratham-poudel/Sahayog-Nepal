import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import SEO from '../utils/seo.jsx';
import CampaignList from '../components/campaigns/CampaignList';
import useCampaigns from '../hooks/useCampaigns';
import Pagination from '../components/ui/Pagination';
import { 
  ArrowRight,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// Professional category configurations
const CATEGORY_CONFIGS = {
  cats: {
    title: 'Cat Welfare & Rescue',
    subtitle: 'Supporting feline welfare and rescue operations',
    category: 'Animals',
    subcategory: 'Cats',
    carouselImages: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1517331156700-3c241d2b4d83?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80'
    ],
    photoCredits: [
      "Photo by Mikhail Vasilyev",
      "Photo by The Lucky Neko", 
      "Photo by Pacto Visual",
      "Photo by Erik-Jan Leusink"
    ],
    animatedTexts: [
      "Rescuing cats from the streets",
      "Providing medical care & shelter",
      "Finding loving forever homes",
      "Building safer communities for cats"
    ]
  },  dogs: {
    title: 'Dog Rescue & Rehabilitation',
    subtitle: 'Supporting canine welfare and rehabilitation programs',
    category: 'Animals',
    subcategory: 'Dogs',
    carouselImages: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80'
    ],
    photoCredits: [
      "Photo by Joe Caione",
      "Photo by Karsten Winegeart",
      "Photo by Anthony Duran", 
      "Photo by Justin Veenema"
    ],
    animatedTexts: [
      "Saving abandoned dogs",
      "Rehabilitation & medical care",
      "Training for new families",
      "Creating happy endings"
    ]
  },  'primary-education': {
    title: 'Primary Education Initiative',
    subtitle: 'Supporting educational programs and infrastructure',
    category: 'Education',
    subcategory: 'Primary Education',
    carouselImages: [
      'https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80'
    ],
    photoCredits: [
      "Photo by Green Chameleon",
      "Photo by NeONBRAND",
      "Photo by Tra Nguyen",
      "Photo by Jeswin Thomas"
    ],
    animatedTexts: [
      "Building better classrooms",
      "Providing quality education",
      "Supporting young minds",
      "Investing in the future"
    ]
  },  'medical-treatment': {
    title: 'Medical Treatment Support',
    subtitle: 'Supporting healthcare and medical assistance programs',
    category: 'Healthcare',
    subcategory: 'Medical Treatment',
    carouselImages: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80'
    ],
    photoCredits: [
      "Photo by Hush Naidoo Jade",
      "Photo by Online Marketing",
      "Photo by Jesper Aggergaard",
      "Photo by National Cancer Institute"
    ],
    animatedTexts: [
      "Providing critical medical care",
      "Supporting patient recovery",
      "Advancing medical research",
      "Healing lives with compassion"
    ]
  },  reforestation: {
    title: 'Reforestation & Conservation',
    subtitle: 'Supporting environmental restoration and conservation',
    category: 'Environment',
    subcategory: 'Reforestation',
    carouselImages: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1440342359438-84bfb90a52d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800&q=80'
    ],
    photoCredits: [
      "Photo by Casey Horner",
      "Photo by veeterzy",
      "Photo by Qingbao Meng",
      "Photo by Noah Buscher"
    ],
    animatedTexts: [
      "Restoring natural forests",
      "Protecting wildlife habitats",
      "Fighting climate change",
      "Growing a greener future"
    ]
  }
};

const CategoryExplore = ({ subcategory }) => {
  const [location] = useLocation();
  const { getAllCampaigns, loading } = useCampaigns();
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  // Get configuration for this subcategory
  const config = CATEGORY_CONFIGS[subcategory];
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Category Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The category "{subcategory}" is not available yet.
          </p>
          <a 
            href="/explore" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Explore All Campaigns
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // Carousel functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % config.carouselImages.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [config.carouselImages.length]);
  // Fetch campaigns combining featured and regular campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // Fetch featured campaigns first
        const featuredResult = await getAllCampaigns({
          page: 1,
          limit: 50, // Get all featured campaigns
          category: config.category,
          subcategory: config.subcategory,
          featured: true,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        // Fetch all campaigns (including featured) to get total count
        const allResult = await getAllCampaigns({
          page: pagination.page,
          limit: pagination.limit,
          category: config.category,
          subcategory: config.subcategory,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        const featuredCampaigns = featuredResult?.campaigns || [];
        const allCampaigns = allResult?.campaigns || [];
        
        // Create a Set of featured campaign IDs to avoid duplicates
        const featuredIds = new Set(featuredCampaigns.map(campaign => campaign._id));
        
        // Filter out featured campaigns from all campaigns to get non-featured ones
        const nonFeaturedCampaigns = allCampaigns.filter(campaign => !featuredIds.has(campaign._id));
        
        // Combine featured campaigns first, then non-featured campaigns
        const combinedCampaigns = [...featuredCampaigns, ...nonFeaturedCampaigns];
        
        setAllCampaigns(combinedCampaigns);
        setTotalCampaigns(allResult?.total || 0);
        
        if (allResult?.pagination) {
          setPagination(allResult.pagination);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setAllCampaigns([]);
      }
    };

    fetchCampaigns();
  }, [pagination.page, config.category, config.subcategory]);
  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % config.carouselImages.length
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? config.carouselImages.length - 1 : prevIndex - 1
    );
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <>
      <SEO 
        title={`${config.title} - ${config.subtitle}`}
        description={config.subtitle}
        keywords={`${config.subcategory}, ${config.category}, campaigns, Nepal, fundraising, donation`}
      />
        <div className="min-h-screen bg-white dark:bg-gray-900">        {/* Maroon Hero Section with Carousel */}
        <div className="relative bg-gradient-to-br from-[#8B2325] via-[#a32729] to-[#b12a2c] text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/50 to-transparent"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
              {/* Left Side - Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-white"
              >
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-white/80 mb-8">
                  <a href="/" className="hover:text-white transition-colors">
                    Home
                  </a>
                  <ChevronRight className="w-4 h-4" />
                  <a href="/explore" className="hover:text-white transition-colors">
                    Explore
                  </a>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white font-medium">
                    {config.subcategory}
                  </span>
                </nav>                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  {config.title}
                </h1>

                <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
                  {config.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/start-campaign" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    Start a Campaign
                    <ArrowRight className="w-5 h-5" />
                  </a>                  <a 
                    href="/explore" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    Browse Categories
                  </a>
                </div>
              </motion.div>

              {/* Right Side - Image Carousel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="relative w-full max-w-md mx-auto">                  {/* Portrait Frame */}
                  <div className="relative aspect-[3/4] bg-white rounded-2xl p-4 shadow-2xl">
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentImageIndex}
                          src={config.carouselImages[currentImageIndex]}
                          alt={`${config.subcategory} ${currentImageIndex + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                        />
                      </AnimatePresence>
                      
                      {/* Animated Text Overlay - Tinder Style */}
                      <div className="absolute top-4 left-4 right-4 z-10">
                        <AnimatePresence mode="wait">
                          <motion.h3
                            key={currentImageIndex}
                            className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-2xl"
                            style={{
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)'
                            }}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.9 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            {config.animatedTexts[currentImageIndex]}
                          </motion.h3>
                        </AnimatePresence>
                      </div>
                        {/* Gradient overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none"></div>
                      
                      {/* Photographer Credit - Bottom Right */}
                      <div className="absolute bottom-12 right-4 z-10">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentImageIndex}
                            className="text-xs text-white/80 bg-black/30 px-2 py-1 rounded backdrop-blur-sm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                          >
                            {config.photoCredits[currentImageIndex]}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      
                      {/* Navigation Arrows */}
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-20"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-20"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Dots Indicator */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {config.carouselImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex 
                                ? 'bg-white' 
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* All Campaigns Section */}
        <div className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div 
              className="flex justify-between items-end mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {config.subcategory} Campaigns
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {totalCampaigns > 0 ? 
                    `${totalCampaigns} active campaigns` : 
                    'No campaigns available yet'
                  }
                </p>
              </div>
              
              {totalCampaigns > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Campaigns
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalCampaigns}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <CampaignList campaigns={allCampaigns} loading={loading} />
            </motion.div>

            {/* Pagination */}
            {!loading && allCampaigns.length > 0 && pagination.totalPages > 1 && (
              <motion.div 
                className="mt-16 flex justify-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <Pagination 
                  currentPage={pagination.page} 
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </motion.div>
            )}

            {/* Professional Empty State */}
            {!loading && allCampaigns.length === 0 && (
              <motion.div 
                className="text-center py-20"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  No campaigns available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Be the first to create a {config.subcategory.toLowerCase()} campaign.
                </p>
                <a 
                  href="/start-campaign" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                >
                  Create Campaign
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            )}
          </div>
        </div>

        {/* Simple Call to Action */}
        <div className="py-16 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Start Your Own Campaign
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Create a campaign to raise funds for your {config.subcategory.toLowerCase()} cause and make a meaningful impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/start-campaign" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                >
                  Create Campaign
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/explore" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Browse All Categories
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryExplore;
