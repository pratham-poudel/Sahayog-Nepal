import React, { useState } from 'react';
import ShareableSocialCard from './ShareableSocialCard';

const ShareableCardTest = () => {
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Sample campaign data for testing
  const sampleCampaign = {
    title: "Help Build a School in Rural Nepal",
    description: "We are raising funds to build a new school in a remote village in Nepal. This school will provide education to over 200 children who currently have to walk 3 hours to reach the nearest school. Your donation will help us build classrooms, provide desks, books, and supplies for these deserving children.",
    thumbnail: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop",
    raised: 75000,
    goal: 150000,
    progress: 50,
    daysLeft: 25,
    category: "Education",
    donorsCount: 42
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Test Shareable Card</h1>
        <div className="mb-4">
          <img 
            src={sampleCampaign.thumbnail} 
            alt={sampleCampaign.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h2 className="text-lg font-semibold mb-2">{sampleCampaign.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{sampleCampaign.description.substring(0, 100)}...</p>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">Rs. {sampleCampaign.raised.toLocaleString()}</span>
            <span className="text-gray-500">of Rs. {sampleCampaign.goal.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-[#8B2325] rounded-full"
              style={{ width: `${sampleCampaign.progress}%` }}
            />
          </div>
        </div>
        
        <button
          onClick={() => setIsShareOpen(true)}
          className="w-full bg-[#8B2325] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#6d1b1e] transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span>Share Campaign</span>
        </button>
      </div>

      <ShareableSocialCard
        campaign={sampleCampaign}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};

export default ShareableCardTest;