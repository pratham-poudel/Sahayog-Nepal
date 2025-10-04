import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ui/ThemeToggle';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  const tagline = "Nepal's crowdfunding platform dedicated to creating positive change.";

  return (
    <footer className="bg-white text-gray-800 dark:bg-gray-950 dark:text-white py-8 transition-colors duration-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {/* Logo & Tagline */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 flex items-center justify-center bg-[#8B2325] rounded-full mr-2">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="text-xl font-poppins font-bold">
                <span className="text-gray-800 dark:text-white">Sahayog</span><span className="text-[#D5A021]">Nepal</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{tagline}</p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="Facebook">
                <i className="ri-facebook-fill text-lg"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="Twitter">
                <i className="ri-twitter-fill text-lg"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="Instagram">
                <i className="ri-instagram-line text-lg"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="LinkedIn">
                <i className="ri-linkedin-fill text-lg"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/explore" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Explore Campaigns</Link></li>
              <li><Link href="/start-campaign" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Start Campaign</Link></li>
              <li><Link href="/about" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Categories</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/explore?category=Education" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Education</Link></li>
              <li><Link href="/explore?category=Healthcare" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Healthcare</Link></li>
              <li><Link href="/explore?category=Disaster Relief" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Disaster Relief</Link></li>
              <li><Link href="/explore?category=Environment" className="text-gray-500 hover:text-[#8B2325] dark:text-gray-400 dark:hover:text-white transition-colors">Environment</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Contact</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <i className="ri-map-pin-line text-[#8B2325] dark:text-[#e05759] mr-2"></i>
                <span>Thamel, Kathmandu</span>
              </li>
              <li className="flex items-center">
                <i className="ri-phone-line text-[#8B2325] dark:text-[#e05759] mr-2"></i>
                <span>+977 1 4123456</span>
              </li>
              <li className="flex items-center">
                <i className="ri-mail-line text-[#8B2325] dark:text-[#e05759] mr-2"></i>
                <span>info@sahayognepal.com</span>
              </li>
            </ul>
            
            {/* Theme Toggle - Inline with smaller footprint */}
            <div className="mt-3 flex items-center">
              <ThemeToggle />
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Copyright and Links */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Copyright &copy;{currentYear} Dallytech Pvt Ltd. All Rights Reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Link href="/terms-of-use" className="hover:text-[#8B2325] dark:hover:text-white transition-colors">
                  Terms of Use
                </Link>
                <span>|</span>
                <Link href="/privacy-policy" className="hover:text-[#8B2325] dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <span>|</span>
                <Link href="/cookie-policy" className="hover:text-[#8B2325] dark:hover:text-white transition-colors">
                  Use of Cookies
                </Link>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="max-w-4xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                The SahayogNepal.org is a product of  a private limited company operating an online intermediary platform providing crowdfunding services for medical, social and charitable causes. We facilitate transactions between contributors and campaigners. SahayogNepal does not provide any financial benefits in any form whatsoever to any person making contributions on its platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;






