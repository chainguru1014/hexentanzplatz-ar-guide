/**
 * Mattercraft bridge: thin layer so UI doesn't depend on Mattercraft internals.
 * Expects window.MC to be provided by the Mattercraft integration.
 * Falls back to postMessage when Mattercraft is in an iframe.
 */

import { sendToMattercraftIframe, mcShowModel2 as sendShowModel2, mcHideModel2 as sendHideModel2, mcPlayModel2 as sendPlayModel2, mcPauseModel2 as sendPauseModel2 } from "./mcIframeBridge";

declare global {
  interface Window {
    MC?: {
      startQrScan?: () => void;
      loadStation?: (id: string) => void;
      setMode?: (mode: "welcome" | "station") => void;
      takeSnapshot?: () => void;
      playAudio?: () => void;
      pauseAudio?: () => void;
      seekAudio?: (time: number) => void;
      onAudioPlay?: (callback: () => void) => void;
      onAudioPause?: (callback: () => void) => void;
      onAudioProgress?: (callback: (time: number, duration: number) => void) => void;
      // Dual model support (Station 3+)
      showModel2?: () => void;
      hideModel2?: () => void;
      playModel2?: () => void;
      pauseModel2?: () => void;
    };
  }
}

export function mcStartQrScan(expect?: string): void {
  if (window.MC?.startQrScan) {
    window.MC.startQrScan();
    return;
  }
  // Fallback: Mattercraft may listen for postMessage
  window.postMessage(
    { type: "mc:cmd", cmd: "startQrScan", expect: expect ?? undefined },
    "*"
  );
}

export function mcLoadStation(id: string): void {
  window.MC?.loadStation?.(id);
}

export function mcSetMode(mode: "welcome" | "station"): void {
  window.MC?.setMode?.(mode);
}

export function mcTakeSnapshot(): void {
  window.MC?.takeSnapshot?.();
}

export function onMcQr(cb: (payload: string) => void): () => void {
  const handler = (e: Event) => {
    const ev = e as CustomEvent<string>;
    if (ev.detail != null) cb(String(ev.detail));
  };
  window.addEventListener("mc:qr", handler);
  return () => window.removeEventListener("mc:qr", handler);
}

export function onMcStationReady(cb: () => void): () => void {
  window.addEventListener("mc:stationReady", cb);
  return () => window.removeEventListener("mc:stationReady", cb);
}

export function onMcSnapshot(cb: (data: unknown) => void): () => void {
  const handler = (e: Event) => {
    const ev = e as CustomEvent;
    cb(ev.detail);
  };
  window.addEventListener("mc:snapshot", handler);
  return () => window.removeEventListener("mc:snapshot", handler);
}

export function mcPlayAudio(): void {
  if (window.MC?.playAudio) {
    window.MC.playAudio();
    return;
  }
  // Fallback: send postMessage to Mattercraft iframe
  sendToMattercraftIframe("MC_PLAY");
}

export function mcPauseAudio(): void {
  if (window.MC?.pauseAudio) {
    window.MC.pauseAudio();
    return;
  }
  // Fallback: send postMessage to Mattercraft iframe
  sendToMattercraftIframe("MC_PAUSE");
}

export function mcSeekAudio(time: number): void {
  if (window.MC?.seekAudio) {
    window.MC.seekAudio(time);
    return;
  }
  // Fallback: send postMessage to Mattercraft iframe
  sendToMattercraftIframe("MC_SEEK", { time });
}

// Extended commands for dual model support (Station 3+)
export function mcShowModel2(): void {
  if (window.MC?.showModel2) {
    window.MC.showModel2();
    return;
  }
  sendShowModel2();
}

export function mcHideModel2(): void {
  if (window.MC?.hideModel2) {
    window.MC.hideModel2();
    return;
  }
  sendHideModel2();
}

export function mcPlayModel2(): void {
  if (window.MC?.playModel2) {
    window.MC.playModel2();
    return;
  }
  sendPlayModel2();
}

export function mcPauseModel2(): void {
  if (window.MC?.pauseModel2) {
    window.MC.pauseModel2();
    return;
  }
  sendPauseModel2();
}

export function onMcAudioPlay(cb: () => void): () => void {
  if (window.MC?.onAudioPlay) {
    window.MC.onAudioPlay(cb);
    return () => {}; // Cleanup handled by Mattercraft
  }
  // Fallback to event listener
  window.addEventListener("mc:audio:play", cb);
  return () => window.removeEventListener("mc:audio:play", cb);
}

export function onMcAudioPause(cb: () => void): () => void {
  if (window.MC?.onAudioPause) {
    window.MC.onAudioPause(cb);
    return () => {}; // Cleanup handled by Mattercraft
  }
  // Fallback to event listener
  window.addEventListener("mc:audio:pause", cb);
  return () => window.removeEventListener("mc:audio:pause", cb);
}

export function onMcAudioProgress(cb: (time: number, duration: number) => void): () => void {
  if (window.MC?.onAudioProgress) {
    window.MC.onAudioProgress(cb);
    return () => {}; // Cleanup handled by Mattercraft
  }
  // Fallback to event listener
  const handler = (e: Event) => {
    const ev = e as CustomEvent<{ time: number; duration: number }>;
    cb(ev.detail.time, ev.detail.duration);
  };
  window.addEventListener("mc:audio:progress", handler);
  return () => window.removeEventListener("mc:audio:progress", handler);
}
