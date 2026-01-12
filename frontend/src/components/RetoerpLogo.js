import React from 'react';

/**
 * ExlainERP Logo Component
 * 
 * Usage:
 * <ExlainERPLogo variant="full" size="md" />
 * <ExlainERPLogo variant="icon" size="sm" />
 * <ExlainERPLogo variant="white" size="lg" />
 */

const ExlainERPLogo = ({ 
  variant = 'full', // 'full', 'icon', 'white'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  className = '' 
}) => {
  // Size mappings
  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 60, height: 60 },
    lg: { width: 100, height: 100 },
    xl: { width: 150, height: 150 }
  };

  const fullSizes = {
    sm: { width: 200, height: 50 },
    md: { width: 300, height: 75 },
    lg: { width: 400, height: 100 },
    xl: { width: 500, height: 125 }
  };

  // Get logo path based on variant
  const getLogoPath = () => {
    switch (variant) {
      case 'icon':
        return '/exlainerp-logo-icon.svg';
      case 'white':
        return '/exlainerp-logo-white.svg';
      case 'full':
      default:
        return '/exlainerp-logo-full.svg';
    }
  };

  // Get dimensions based on variant and size
  const getDimensions = () => {
    if (variant === 'icon') {
      return sizes[size];
    }
    return fullSizes[size];
  };

  const dimensions = getDimensions();
  const logoPath = getLogoPath();

  return (
    <img
      src={logoPath}
      alt="ExlainERP - Real Estate Automation SaaS"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default ExlainERPLogo;

// Export individual logo components for convenience
export const ExlainERPIconLogo = (props) => <ExlainERPLogo variant="icon" {...props} />;
export const ExlainERPFullLogo = (props) => <ExlainERPLogo variant="full" {...props} />;
export const ExlainERPWhiteLogo = (props) => <ExlainERPLogo variant="white" {...props} />;
