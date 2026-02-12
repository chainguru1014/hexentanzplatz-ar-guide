/**
 * Bridge for communicating with Mattercraft iframe via postMessage
 * Used when Mattercraft is embedded in an iframe (window.MC is not available)
 */

type IframeRef = {
  contentWindow: Window | null;
  src: string;
};

let iframeRef: IframeRef | null = null;

export function registerMattercraftIframe(iframe: HTMLIFrameElement | null) {
  iframeRef = iframe ? {
    contentWindow: iframe.contentWindow,
    src: iframe.src,
  } : null;
}

export function sendToMattercraftIframe(type: string, payload?: any) {
  if (!iframeRef?.contentWindow) {
    console.warn("[mcIframeBridge] No Mattercraft iframe registered");
    return false;
  }

  try {
    iframeRef.contentWindow.postMessage({ type, ...payload }, "*");
    console.log("[mcIframeBridge] Sent to Mattercraft:", type, payload);
    return true;
  } catch (e) {
    console.error("[mcIframeBridge] Failed to send message:", e);
    return false;
  }
}
