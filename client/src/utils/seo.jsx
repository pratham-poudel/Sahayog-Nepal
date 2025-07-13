import { Helmet } from 'react-helmet-async';

export const SEO = ({ title, description, keywords, ogImage, ogUrl }) => {
  const siteTitle = 'Sahayog Nepal - Nepal\'s First Crowdfunding Platform';
  const siteDescription = "Nepal's first and foremost crowdfunding platform. Support local causes, communities, and initiatives across Nepal. Make a difference with your donation today.";
  const siteKeywords = "donation Nepal, crowdfunding Nepal, fundraising Nepal, community support, Sahayog, help Nepal, donate, charity Nepal";
  const siteOgImage = "https://images.unsplash.com/photo-1605745341112-85968b19335b";
  const siteUrl = "https://www.sahayognepal.com";

  return (
    <Helmet>
      <title>{title ? `${title} | ${siteTitle}` : siteTitle}</title>
      <meta name="description" content={description || siteDescription} />
      <meta name="keywords" content={keywords || siteKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl || siteUrl} />
      <meta property="og:title" content={title || siteTitle} />
      <meta property="og:description" content={description || siteDescription} />
      <meta property="og:image" content={ogImage || siteOgImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl || siteUrl} />
      <meta property="twitter:title" content={title || siteTitle} />
      <meta property="twitter:description" content={description || siteDescription} />
      <meta property="twitter:image" content={ogImage || siteOgImage} />
    </Helmet>
  );
};

export default SEO;