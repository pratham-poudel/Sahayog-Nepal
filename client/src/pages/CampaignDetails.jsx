import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { motion } from 'framer-motion';
import SEO from '../utils/seo.jsx';
import { getCoverImageUrl, getCampaignImageUrls, getProfilePictureUrl } from '../utils/imageUtils';
import CampaignDetail from '../components/campaigns/CampaignDetail';
import CampaignCard from '../components/campaigns/CampaignCard';
import { useToast } from '@/hooks/use-toast';
import useCampaigns from '../hooks/useCampaigns';
import axios from 'axios';
import { API_URL as CONFIG_API_URL } from '../config/index.js';

const API_URL = `${CONFIG_API_URL}/api`;

const CampaignDetails = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [relatedCampaigns, setRelatedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getRelatedCampaigns } = useCampaigns();

  useEffect(() => {
    // Ensure the page starts at the top on load
    window.scrollTo(0, 0);
    
    const fetchCampaignData = async () => {
      setLoading(true);
      try {
        // Fetch campaign details
        const campaignRes = await axios.get(`${API_URL}/campaigns/${id}`);
        
        if (campaignRes.data.success) {
          const campaignData = campaignRes.data.campaign;
          setCampaign(campaignData);
          
          // Fetch related campaigns in the same category
          if (campaignData.category) {
            try {
              const related = await getRelatedCampaigns(id, campaignData.category, 3);
              setRelatedCampaigns(related);
            } catch (error) {
              console.error('Error fetching related campaigns:', error);
              // Don't show error toast for related campaigns as it's not critical
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Campaign not found",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCampaignData();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-300 rounded-xl mb-6"></div>
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-full bg-gray-200 rounded-xl p-6">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
                <div className="h-10 bg-gray-300 rounded mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {campaign && (
        <SEO 
          title={campaign.title}
          description={campaign.shortDescription}
          keywords={`${campaign.title}, ${campaign.category}, fundraising, donation, Nepal`}
          ogImage={getCoverImageUrl(campaign)}
        />
      )}
      
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {campaign ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-6 text-center md:text-left" style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%',
                lineHeight: '1.2'
              }}>
                {campaign.title}
              </h1>
              
              <CampaignDetail campaign={{
                ...campaign,
                thumbnail: getCoverImageUrl(campaign),
                images: getCampaignImageUrls(campaign),
                raised: campaign.amountRaised || 0,
                goal: campaign.targetAmount,
                progress: campaign.percentageRaised || 0,
                daysLeft: campaign.daysLeft || 0,
                donors: campaign.donors || 0,
                longDescription: campaign.story,
                verificationDocuments: campaign.verificationDocuments || [],
                lapLetter: campaign.lapLetter || null,
                creator: {
                  _id: campaign.creator?._id,
                  name: campaign.creator?.name || 'Anonymous',
                  image: campaign.creator ? getProfilePictureUrl(campaign.creator) : 'https://ui-avatars.com/api/?name=Anonymous&background=random',
                  isPremiumAndVerified: campaign.creator?.isPremiumAndVerified || false
                }
              }} />
              
              {relatedCampaigns.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-2xl font-poppins font-semibold mb-6">Related Campaigns</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedCampaigns.map((relatedCampaign) => (
                      <CampaignCard 
                        key={relatedCampaign._id} 
                        campaign={relatedCampaign}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-xl font-medium mb-2">Campaign not found</h3>
              <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CampaignDetails;
