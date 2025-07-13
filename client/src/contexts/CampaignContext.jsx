import { createContext, useContext } from 'react';
import useCampaigns from '../hooks/useCampaigns';

// Create the context
export const CampaignContext = createContext(null);

// Campaign provider component
export const CampaignProvider = ({ children }) => {
  const campaignService = useCampaigns();
  
  return (
    <CampaignContext.Provider value={campaignService}>
      {children}
    </CampaignContext.Provider>
  );
};

// Custom hook to use the campaign context
export const useCampaignContext = () => {
  const context = useContext(CampaignContext);
  
  if (!context) {
    throw new Error('useCampaignContext must be used within a CampaignProvider');
  }
  
  return context;
};
