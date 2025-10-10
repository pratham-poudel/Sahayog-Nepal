import { Link } from 'wouter';
import PropTypes from 'prop-types';

const Logo = ({ 
  size = 'medium', 
  className = '',
  linkTo = '/',
  onClick = null 
}) => {
  const logoUrl = 'https://filesatsahayognepal.dallytech.com/misc/SahayogNepal%20(1).png';
  
  // Size configurations - logo image already contains the text
  const sizeConfig = {
    small: {
      image: 'h-20 w-auto'
    },
    medium: {
      image: 'h-32 w-auto md:h-36 md:w-auto'
    },
    large: {
      image: 'h-36 w-auto md:h-40 md:w-auto lg:h-48 lg:w-auto'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoUrl} 
        alt="Sahayog Nepal - Nepal's Crowdfunding Platform" 
        className={`${config.image} object-contain`}
        loading="lazy"
      />
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="focus:outline-none">
        <LogoContent />
      </button>
    );
  }

  return (
    <Link href={linkTo}>
      <a className="focus:outline-none">
        <LogoContent />
      </a>
    </Link>
  );
};

Logo.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  linkTo: PropTypes.string,
  onClick: PropTypes.func
};

export default Logo;
