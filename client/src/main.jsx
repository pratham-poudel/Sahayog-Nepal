import { createRoot } from "react-dom/client";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <HelmetProvider>
      <Helmet>
        <title>Sahayog Nepal - Nepal's First Crowdfunding Platform</title>
        <meta name="description" content="Nepal's first and foremost crowdfunding platform. Support local causes, communities, and initiatives across Nepal. Make a difference with your donation today." />
        <meta name="keywords" content="donation Nepal, crowdfunding Nepal, fundraising Nepal, community support, Sahayog, help Nepal, donate, charity Nepal" />
        <meta property="og:title" content="Sahayog Nepal - Crowdfunding for Nepal" />
        <meta property="og:description" content="Support causes that matter in Nepal. Join the movement to transform lives through Nepal's premier donation platform." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1605745341112-85968b19335b" />
        <meta property="og:url" content="https://www.sahayognepal.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@400;500;600;700&family=Mukta:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
         <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
    async
    defer
  ></script>
      </Helmet>
      <App />
    </HelmetProvider>
  );
}
