// utils/vpnDetection.js
const axios = require('axios');

/**
 * Extract real IP from request considering proxies
 */
function getClientIp(req) {
  // Check X-Forwarded-For header (from proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Get first IP in the list (original client)
    return forwardedFor.split(',')[0].trim();
  }
  
  // Check X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }
  
  // Fallback to req.ip or req.connection.remoteAddress
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Check if IP is a VPN/Proxy using multiple methods
 */
async function isVPN(ip) {
  // Skip check for localhost/private IPs
  if (!ip || ip === 'unknown' || isPrivateIP(ip)) {
    return false;
  }

  try {
    // Method 1: Check using ip-api.com (free, no key needed)
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, {
      timeout: 3000
    });
    
    if (response.data.proxy || response.data.hosting) {
      console.log(`[VPN Detection] IP ${ip} flagged as proxy/hosting`);
      return true;
    }

    // Method 2: Check common VPN ports and characteristics
    // This is a heuristic approach - you can expand this
    
    return false;
  } catch (error) {
    console.error('[VPN Detection] Error checking IP:', error.message);
    // On error, don't block - allow the transaction but log it
    return false;
  }
}

/**
 * Check if IP is a private/local IP address
 */
function isPrivateIP(ip) {
  // Check for IPv4 private ranges
  const ipv4Private = [
    /^127\./,                    // Loopback
    /^10\./,                      // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
    /^192\.168\./,                // Private Class C
    /^::1$/,                      // IPv6 loopback
    /^fe80:/,                     // IPv6 link-local
    /^fc00:/,                     // IPv6 private
    /^localhost$/i                // localhost
  ];
  
  return ipv4Private.some(pattern => pattern.test(ip));
}

/**
 * Enhanced VPN detection using ipapi.co (has free tier, more reliable)
 * Requires API key for production use
 */
async function isVPNAdvanced(ip) {
  if (!ip || ip === 'unknown' || isPrivateIP(ip)) {
    return { isVPN: false, provider: null };
  }

  try {
    // Using ipapi.co - 30k requests/month free
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000
    });
    
    const data = response.data;
    
    // Check multiple indicators
    const isVPN = 
      data.asn?.includes('VPN') ||
      data.org?.toLowerCase().includes('vpn') ||
      data.org?.toLowerCase().includes('proxy') ||
      data.org?.toLowerCase().includes('hosting') ||
      data.org?.toLowerCase().includes('datacenter');
    
    return {
      isVPN,
      provider: data.org || null,
      country: data.country_name,
      countryCode: data.country_code
    };
  } catch (error) {
    console.error('[VPN Detection Advanced] Error:', error.message);
    // Fallback to basic check
    const basicCheck = await isVPN(ip);
    return { isVPN: basicCheck, provider: null };
  }
}

/**
 * Get comprehensive IP information including geolocation
 */
async function getIPInfo(ip) {
  if (!ip || ip === 'unknown' || isPrivateIP(ip)) {
    return {
      ip,
      country: null,
      countryCode: null,
      isVPN: false,
      isPrivate: true
    };
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,proxy,hosting,query`, {
      timeout: 3000
    });
    
    const data = response.data;
    
    return {
      ip: data.query || ip,
      country: data.country || null,
      countryCode: data.countryCode || null,
      isVPN: data.proxy || data.hosting || false,
      isPrivate: false
    };
  } catch (error) {
    console.error('[IP Info] Error fetching IP information:', error.message);
    return {
      ip,
      country: null,
      countryCode: null,
      isVPN: false,
      isPrivate: false
    };
  }
}

module.exports = {
  getClientIp,
  isVPN,
  isVPNAdvanced,
  isPrivateIP,
  getIPInfo
};
