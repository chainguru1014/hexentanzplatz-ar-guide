"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the device is a real mobile phone (not just desktop browser in responsive mode)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability and screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Real mobile device: has touch AND (small screen OR mobile user agent)
      const mobile = hasTouch && (isSmallScreen || isMobileUserAgent);
      
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Gets the bottom safe area padding for mobile devices
 * Returns additional padding needed for bottom navigation bars
 */
export function useBottomSafeArea(): number {
  const [bottomPadding, setBottomPadding] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setBottomPadding(0);
      return;
    }

    const updatePadding = () => {
      // Try to get safe area inset from CSS
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.bottom = '0';
      testEl.style.left = '0';
      testEl.style.width = '1px';
      testEl.style.height = 'env(safe-area-inset-bottom, 0px)';
      testEl.style.visibility = 'hidden';
      testEl.style.pointerEvents = 'none';
      document.body.appendChild(testEl);
      
      const computed = window.getComputedStyle(testEl);
      let safeAreaInset = parseFloat(computed.height) || 0;
      
      document.body.removeChild(testEl);
      
      // For Android devices, navigation bar is typically 48-80px
      // For iOS devices with notch, safe area inset should work
      // But we need a minimum padding to ensure content isn't cut off
      const minPadding = 70; // Minimum padding for Android navigation bars (typically 56-80px)
      
      // If safe area inset is very small or 0, use minimum padding
      // This handles Android devices where safe-area-inset-bottom might not be supported
      const finalPadding = safeAreaInset > 10 ? safeAreaInset : minPadding;
      
      setBottomPadding(finalPadding);
    };

    // Initial calculation
    updatePadding();
    
    // Recalculate on resize and orientation change
    window.addEventListener('resize', updatePadding);
    window.addEventListener('orientationchange', updatePadding);
    
    // Also check after delays to ensure safe area is calculated after page load
    const timeouts = [
      setTimeout(updatePadding, 100),
      setTimeout(updatePadding, 500),
      setTimeout(updatePadding, 1000),
    ];
    
    return () => {
      window.removeEventListener('resize', updatePadding);
      window.removeEventListener('orientationchange', updatePadding);
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isMobile]);

  return bottomPadding;
}
