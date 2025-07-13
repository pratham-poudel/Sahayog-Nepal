import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [location] = useLocation();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/explore', label: 'Explore' },
    { path: '/start-campaign', label: 'Start a Campaign' },
    { path: '/earn', label: 'Earn with Us' },
    { path: '/about', label: 'About Us' },
    { path: '/success-stories', label: 'Success Stories' }
  ];

  return (
    <nav className="hidden md:flex items-center mx-4 lg:mx-6">
      <ul className="flex flex-wrap justify-center space-x-2 lg:space-x-5 font-medium text-gray-800 dark:text-gray-200">
        {links.map((link) => (
          <li key={link.path} className="relative whitespace-nowrap">
            <Link href={link.path}>
              <div className={`block py-2 px-2 lg:px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                location === link.path 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {link.label}
                {location === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
