import { useState } from 'react';
import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';
import { successStory } from '../data/stats';

const SuccessStories = () => {
  // Sample success stories data
  const stories = [
    {
      id: 1,
      title: "Rebuilding Sindhupalchok After the Earthquake",
      description: "How community-led reconstruction transformed a devastated village into a model of resilience.",
      image: "https://images.unsplash.com/photo-1595427648952-c59163b40315",
      category: "Disaster Relief",
      date: "June 2022",
      impact: "165+ lives improved, 32 homes built, 1 school repaired",
      featured: true
    },
    {
      id: 2,
      title: "Clean Water Initiative in Dolpa",
      description: "Bringing sustainable clean water solutions to remote mountain communities.",
      image: "https://images.unsplash.com/photo-1606819717115-9159c900370b",
      category: "Water & Sanitation",
      date: "March 2023",
      impact: "400+ families now have access to clean drinking water"
    },
    {
      id: 3,
      title: "Girls' Education Scholarship Program",
      description: "Breaking barriers and creating opportunities for underprivileged girls in rural Nepal.",
      image: "https://images.unsplash.com/photo-1518483492057-6829feb807b0",
      category: "Education",
      date: "September 2022",
      impact: "75 girls received full scholarships for continuing education"
    },
    {
      id: 4,
      title: "Mobile Health Camps in Karnali",
      description: "Bringing essential healthcare services to Nepal's most remote province.",
      image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6",
      category: "Healthcare",
      date: "January 2023",
      impact: "Over 1,200 patients received medical care across 8 villages"
    },
    {
      id: 5,
      title: "Organic Farming Cooperative in Jumla",
      description: "Transforming traditional farming into sustainable livelihoods through organic certification.",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449",
      category: "Environment",
      date: "November 2022",
      impact: "120 farmers increased their income by an average of 35%"
    },
    {
      id: 6,
      title: "Preserving Ancient Newari Architecture",
      description: "Restoring cultural heritage while creating employment for traditional craftspeople.",
      image: "https://images.unsplash.com/photo-1532106283732-4a7a161fe4a6",
      category: "Heritage Preservation",
      date: "April 2023",
      impact: "5 historic buildings restored, 27 artisans employed"
    }
  ];
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeStory, setActiveStory] = useState(null);
  
  const categories = ['All', 'Disaster Relief', 'Water & Sanitation', 'Education', 'Healthcare', 'Environment', 'Heritage Preservation'];
  
  const filteredStories = selectedCategory === 'All' 
    ? stories 
    : stories.filter(story => story.category === selectedCategory);
  
  const openStoryDetails = (story) => {
    setActiveStory(story);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <SEO 
        title="Success Stories" 
        description="Discover how Sahayog Nepal campaigns have transformed lives and communities across Nepal. Read our success stories."
        keywords="success stories, Nepal impact, crowdfunding success, community transformation"
      />
      
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-4">Success Stories</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover how communities across Nepal have been transformed through the power of crowdfunding and collective action.
            </p>
          </motion.div>
          
          {/* Featured Story */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {activeStory ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img 
                      src={activeStory.image} 
                      alt={activeStory.title} 
                      className="w-full h-72 md:h-full object-cover"
                    />
                  </div>
                  <div className="p-8 md:w-1/2">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                        {activeStory.category}
                      </span>
                      <span className="text-gray-500 text-sm">{activeStory.date}</span>
                    </div>
                    
                    <h2 className="text-2xl font-poppins font-bold mb-4">{activeStory.title}</h2>
                    <p className="text-gray-700 mb-6">{activeStory.description}</p>
                    
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Impact</h3>
                      <p className="text-gray-700">{activeStory.impact}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Challenge</h3>
                      <p className="text-gray-700">
                        Residents faced significant challenges following the devastating earthquake, including destroyed homes, limited access to clean water, and disrupted education for children.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Solution</h3>
                      <p className="text-gray-700">
                        Through Sahayog Nepal, the community raised funds to rebuild homes using earthquake-resistant techniques, repair the local school, and install water filtration systems.
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Campaign Lead</p>
                        <div className="flex items-center mt-1">
                          <img 
                            src="https://randomuser.me/api/portraits/men/82.jpg" 
                            alt="Campaign Lead" 
                            className="h-8 w-8 rounded-full object-cover mr-2"
                          />
                          <span className="font-medium">Ramesh Karki</span>
                        </div>
                      </div>
                      
                      <motion.button 
                        className="text-primary-600 font-medium flex items-center"
                        onClick={() => setActiveStory(null)}
                        whileHover={{ x: -3 }}
                      >
                        <i className="ri-arrow-left-line mr-1"></i>
                        Back to all stories
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 text-white relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <img 
                    src={successStory.image} 
                    alt={successStory.title} 
                    className="w-full h-full object-cover opacity-25"
                  />
                </div>
                <div className="relative z-10 p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <span className="inline-block px-3 py-1 bg-primary-500 bg-opacity-30 text-primary-300 rounded-full text-sm font-medium mb-4">Featured Story</span>
                      <h2 className="text-2xl md:text-3xl font-poppins font-bold mb-4">{successStory.title}</h2>
                      <p className="text-gray-300 mb-6">{successStory.description}</p>
                      
                      <div className="flex items-center mb-6">
                        <div className="flex -space-x-2 mr-4">
                          {successStory.leaders.map((leader, index) => (
                            <img 
                              key={index}
                              className="h-10 w-10 rounded-full border-2 border-gray-900" 
                              src={leader.image} 
                              alt={leader.name}
                            />
                          ))}
                        </div>
                        <div>
                          <p className="text-sm text-gray-300">Led by</p>
                          <p className="font-medium">Ramesh Karki & Community Leaders</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-6">
                        {successStory.impact.map((item, index) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-3">
                            <p className="font-bold text-xl">{item.value}</p>
                            <p className="text-xs text-gray-400">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      
                      <motion.button 
                        className="py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        onClick={() => openStoryDetails(stories[0])}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Read Full Story
                      </motion.button>
                    </div>
                    
                    <div className="hidden md:block">
                      <img 
                        src={successStory.image} 
                        alt={successStory.title} 
                        className="rounded-xl shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          
          {!activeStory && (
            <>
              {/* Category Filter */}
              <div className="mb-8 flex overflow-x-auto space-x-2 py-2">
                {categories.map((category, index) => (
                  <motion.button
                    key={index}
                    className={`whitespace-nowrap px-4 py-2 rounded-full ${
                      selectedCategory === category 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    } flex-shrink-0`}
                    onClick={() => setSelectedCategory(category)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
              
              {/* Stories Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    className="bg-white rounded-xl overflow-hidden shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative h-48">
                      <img 
                        src={story.image} 
                        alt={story.title} 
                        className="w-full h-full object-cover"
                      />
                      {story.featured && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-md">
                            Featured
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                          {story.category}
                        </span>
                        <span className="text-gray-500 text-sm">{story.date}</span>
                      </div>
                      <h3 className="font-poppins font-semibold text-lg mb-2">{story.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{story.description}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        <span className="font-medium">Impact:</span> {story.impact}
                      </p>
                      <motion.button 
                        className="text-primary-600 font-medium flex items-center"
                        onClick={() => openStoryDetails(story)}
                        whileHover={{ x: 3 }}
                      >
                        Read full story
                        <i className="ri-arrow-right-line ml-1"></i>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
          
          {/* Call to Action */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-poppins font-semibold mb-4">Create Your Own Success Story</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join the hundreds of individuals and organizations who have successfully raised funds and made a difference through Sahayog Nepal.
            </p>
            <motion.a 
              href="/start-campaign" 
              className="py-3 px-8 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start a Campaign
            </motion.a>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SuccessStories;
