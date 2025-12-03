import { useState, useEffect } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "./components/ui/toaster";

// Contexts
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { CampaignProvider } from "./contexts/CampaignContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { StatsProvider } from "./contexts/StatsContext";

// DevTools Protection
// import { useDevToolsProtection } from "./hooks/useDevToolsProtection.jsx";

// Layout components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import DonationNotification from "./components/ui/DonationNotification";
import ProtectedRoute from "./components/ui/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Explore from "./pages/ExploreNew";
import CategoryExplore from "./pages/CategoryExplore";
import CampaignDetails from "./pages/CampaignDetails";
import StartCampaign from "./pages/StartCampaign";
import About from "./pages/About";
import Team from "./pages/Team";
import UserDashboard from "./pages/UserDashboard";
import Profile from "./pages/Profile";
import NotFound from "@/pages/not-found";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EditCampaign from "./pages/EditCampaign";
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CampaignDetail from './pages/admin/CampaignDetail';
import UserDetail from './pages/admin/UserDetail';
import PaymentDetail from './pages/admin/PaymentDetail';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentCancel from './pages/payment/PaymentCancel';
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import WriteBlog from "./pages/WriteBlog";
import DetailedStatistics from "./pages/DetailedStatistics";
import UserProfile from "./pages/UserProfile";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import EmployeePortal from "./pages/EmployeePortal";
import KYCVerifierDashboard from "./pages/KYCVerifierDashboard";
import CampaignVerifierDashboard from "./pages/CampaignVerifierDashboard";
import WithdrawalProcessorDashboard from "./pages/WithdrawalProcessorDashboard";
import TransactionManagementDashboard from "./pages/TransactionManagementDashboard";
import LegalDashboard from "./pages/LegalDashboard";

// App wrapper to use auth context
function AppContent() {
  const [location] = useLocation();
  const { refreshAuth } = useAuthContext();
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // // DevTools Protection - blocks UI and API requests when DevTools detected
  // const { blockUI } = useDevToolsProtection({
  //   autoBlock: true,
  //   blockUI: true,
  //   showWarning: true,
  //   onDetect: (isOpen) => {
  //     if (isOpen) {
  //       console.clear();
  //     }
  //   }
  // });

  // Refresh auth on app start
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Listen for theme changes in the DOM
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // // Additional security measures - disable DevTools shortcuts
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     // F12
  //     if (e.keyCode === 123) {
  //       e.preventDefault();
  //       return false;
  //     }
  //     // Ctrl+Shift+I (DevTools)
  //     if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
  //       e.preventDefault();
  //       return false;
  //     }
  //     // Ctrl+Shift+J (Console)
  //     if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
  //       e.preventDefault();
  //       return false;
  //     }
  //     // Ctrl+Shift+C (Inspect)
  //     if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
  //       e.preventDefault();
  //       return false;
  //     }
  //     // Ctrl+U (View Source)
  //     if (e.ctrlKey && e.keyCode === 85) {
  //       e.preventDefault();
  //       return false;
  //     }
  //   };

  //   const handleContextMenu = (e) => {
  //     e.preventDefault();
  //     return false;
  //   };

  //   document.addEventListener('keydown', handleKeyDown);
  //   document.addEventListener('contextmenu', handleContextMenu);

  //   return () => {
  //     document.removeEventListener('keydown', handleKeyDown);
  //     document.removeEventListener('contextmenu', handleContextMenu);
  //   };
  // }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Check if current route is an admin route
  const isAdminRoute = location.startsWith('/admin') || location.startsWith('/helloadmin') || location.startsWith('/employee');

  // // Block UI if DevTools detected
  // if (blockUI) {
  //   return (
  //     <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[99999]">
  //       <div className="text-center max-w-md p-8">
  //         <div className="text-6xl mb-6 animate-pulse">⚠️</div>
  //         <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
  //           Security Warning
  //         </h1>
  //         <div className="space-y-3 mb-6">
  //           <p className="text-lg font-medium">Developer Tools Detected</p>
  //           <p className="text-sm text-gray-400">
  //             For security reasons, this application cannot be used with developer tools open.
  //           </p>
  //         </div>
  //         <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-2">
  //           <p className="text-xs text-red-400">🔒 API Access: Blocked</p>
  //           <p className="text-xs text-red-400">🗑️ Session Data: Cleared</p>
  //         </div>
  //         <p className="mt-6 text-xs text-gray-500">
  //           Please close developer tools and refresh the page to continue.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hide header and footer for admin routes */}
      {!isAdminRoute && <Header />}
      <main className="flex-grow">
      <div className="w-full">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/explore" component={Explore} />
              
              {/* Category-specific explore pages */}
              <Route path="/explore/cats">
                {() => <CategoryExplore subcategory="cats" />}
              </Route>
              <Route path="/explore/dogs">
                {() => <CategoryExplore subcategory="dogs" />}
              </Route>
              <Route path="/explore/primary-education">
                {() => <CategoryExplore subcategory="primary-education" />}
              </Route>
              <Route path="/explore/medical-treatment">
                {() => <CategoryExplore subcategory="medical-treatment" />}
              </Route>
              <Route path="/explore/reforestation">
                {() => <CategoryExplore subcategory="reforestation" />}
              </Route>
              <Route path="/explore/natural-disaster">
                {() => <CategoryExplore subcategory="natural-disaster" />}
              </Route>
              <Route path="/explore/startup">
                {() => <CategoryExplore subcategory="startup" />}
              </Route>
              
              <Route path="/campaign/:id" component={CampaignDetails} />
              <Route path="/detailstatistic/:campaignid" component={DetailedStatistics} />
              <Route path="/start-campaign">
                {() => (
                  <ProtectedRoute>
                    <StartCampaign />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/edit-campaign/:id">
                {(params) => (
                  <ProtectedRoute>
                    <EditCampaign id={params.id} />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/about" component={About} />
              <Route path="/team" component={Team} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/write">
                {() => (
                  <ProtectedRoute>
                    <WriteBlog />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/blog/:slug">
                {(params) => <BlogDetail slug={params.slug} />}
              </Route>
              <Route path="/dashboard">
                {() => (
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/profile">
                {() => (
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/profile/:id">
                {(params) => <UserProfile id={params.id} />}
              </Route>
              <Route path="/terms-of-use" component={TermsOfUse} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/helloadmin" component={AdminLogin} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/campaign/:id">
                {(params) => <CampaignDetail id={params.id} />}
              </Route>
              <Route path="/admin/user/:id">
                {(params) => <UserDetail id={params.id} />}
              </Route>
              <Route path="/admin/payment/:id">
                {(params) => <PaymentDetail id={params.id} />}
              </Route>
              <Route path="/employee" component={EmployeePortal} />
              <Route path="/employee/kyc-dashboard" component={KYCVerifierDashboard} />
              <Route path="/employee/campaign-verifier" component={CampaignVerifierDashboard} />
              <Route path="/employee/withdrawal-processor" component={WithdrawalProcessorDashboard} />
              <Route path="/employee/transaction-management" component={TransactionManagementDashboard} />
              <Route path="/employee/legal-authority" component={LegalDashboard} />
              <Route path="/payment/success" component={PaymentSuccess} />
              <Route path="/payment/cancel" component={PaymentCancel} />
              <Route path="/payment/error">
                {() => (
                  <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Payment Error</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        An error occurred during the payment process. Please try again.
                      </p>
                      <div className="flex justify-center">
                        <a 
                          href="/"
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                        >
                          Return Home
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              
              
              
              
              </Route>

              <Route component={NotFound} />
            </Switch>
          </div>
      </main>
      {/* Hide footer for admin routes */}
      {!isAdminRoute && <Footer />}
      
      {/* Real-time donation notifications */}
      <DonationNotification />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CampaignProvider>
              <StatsProvider>
                <AppContent />
                <Toaster />
              </StatsProvider>
            </CampaignProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;