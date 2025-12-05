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
  const [showBanWarning, setShowBanWarning] = useState(false);
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
          
          // Check if creator is banned
          if (campaignData.creatorBanned || campaignData.creator?.isBanned) {
            setShowBanWarning(true);
          }
          
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
              {/* Ban Warning Overlay */}
              {showBanWarning && (
                <div className="mb-8 bg-red-50 border-2 border-red-500 rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-2">
                        ⚠️ Campaign Creator Suspended
                      </h3>
                      <p className="text-red-800 mb-3">
                        {campaign.banWarning || 'The creator of this campaign has been suspended from the platform. Donations are currently disabled for this campaign.'}
                      </p>
                      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                        <p className="text-sm text-red-900 font-semibold mb-1">
                          🔒 Donations Locked
                        </p>
                        <p className="text-sm text-red-800">
                          This campaign is under review due to the creator's account suspension. All donation functionality has been disabled to protect donors. The account has been flagged and reported to relevant authorities for investigation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                creatorBanned: campaign.creatorBanned || false,
                creator: {
                  _id: campaign.creator?._id,
                  name: campaign.creator?.name || 'Anonymous',
                  image: campaign.creator ? getProfilePictureUrl(campaign.creator) : 'https://ui-avatars.com/api/?name=Anonymous&background=random',
                  isPremiumAndVerified: campaign.creator?.isPremiumAndVerified || false,
                  isBanned: campaign.creator?.isBanned || false
                }
              }} />
              
              {relatedCampaigns.length > 0 && (
                <div className="mt-16 overflow-hidden">
                  <h2 className="text-2xl font-poppins font-semibold mb-6">Related Campaigns</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
