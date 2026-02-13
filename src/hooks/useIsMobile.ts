"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the device is a real mobile phone (not just desktop browser in responsive mode)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check screen size
      const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 1024;
      
      // Check user agent for mobile devices
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
        navigator.userAgent
      );
      
      // Check if running in standalone mode (PWA on mobile)
      const isStandalone = (window.navigator as any).standalone === true || 
                          window.matchMedia('(display-mode: standalone)').matches;
      
      // Real mobile device detection:
      // 1. Has touch capability AND (small screen OR mobile user agent)
      // 2. OR is in standalone mode (PWA)
      // 3. OR has mobile user agent (most reliable)
      const mobile = isMobileUserAgent || (hasTouch && isSmallScreen) || isStandalone;
      
      setIsMobile(mobile);
    };

    // Check immediately
    checkMobile();
    
    // Also check after a delay to catch cases where user agent isn't immediately available
    const timeout = setTimeout(checkMobile, 100);
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
      clearTimeout(timeout);
    };
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
      
      // User requirement: buttons should be 50px higher than device screen bottom
      // This means we need 50px padding from the absolute bottom of the screen
      // The safe area inset already accounts for device-specific bottom bars
      // So we use the safe area inset (if available) plus 50px, or just 50px if no safe area
      const finalPadding = safeAreaInset > 10 ? safeAreaInset + 50 : 50;
      
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
