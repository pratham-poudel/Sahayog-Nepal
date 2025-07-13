import { useState, useEffect } from 'react';
import { Slider } from '../ui/slider';
import { PAYMENT_CONFIG } from '../../config/index';

const PlatformFeeSlider = ({ onFeeChange, defaultValue }) => {
  // Use config or fallback to provided defaultValue
  const configDefaultFee = PAYMENT_CONFIG.defaultPlatformFee;
  const actualDefaultValue = defaultValue || configDefaultFee;
  
  const [feePercentage, setFeePercentage] = useState(actualDefaultValue);
  
  // Fee range configuration
  const minFee = 0;
  const maxFee = 100;
  
  useEffect(() => {
    // Call the parent callback when fee changes
    if (onFeeChange) {
      onFeeChange(feePercentage);
    }
  }, [feePercentage, onFeeChange]);

  const handleSliderChange = (value) => {
    setFeePercentage(value[0]);
  };

  return (
    <div className="platform-fee-slider mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Platform Fee (Tip)
        </label>
        <span className="text-primary-600 dark:text-primary-400 font-medium">{feePercentage.toFixed(1)}%</span>
      </div>
      
      <Slider 
        defaultValue={[actualDefaultValue]} 
        min={minFee} 
        max={maxFee} 
        step={0.5}
        onValueChange={handleSliderChange}
        className="mb-2"
      />
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Min: {minFee}%</span>
        <span className="text-center">Default: {configDefaultFee}%</span>
        <span>Max: {maxFee}%</span>
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
      We do not charge any fees from campaigners. To sustain and operate this platform, we rely entirely on voluntary contributions from supporters like you. While contributing is completely optional, your support directly helps us continue providing this service. 
      </p>
    </div>
  );
};

export default PlatformFeeSlider;