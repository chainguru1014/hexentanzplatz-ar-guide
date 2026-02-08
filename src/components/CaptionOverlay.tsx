"use client";

import { useMemo, useRef, useEffect, useState } from "react";

export type CaptionOverlayProps = {
  script: string;
  currentTime: number;
  duration: number;
  onClose: () => void;
};

/**
 * Splits script text into chunks that will fit exactly 3 visual lines
 * Uses approximate character count based on container width
 */
function splitScriptIntoThreeLineChunks(script: string, containerWidth: number, fontSize: number): string[][] {
  if (!script || script.trim().length === 0) {
    return [];
  }
  
  // Approximate characters per line (fontSize * 0.6 is approximate char width)
  const charsPerLine = Math.floor((containerWidth - 48) / (fontSize * 0.6));
  const charsPerChunk = charsPerLine * 3; // 3 lines per chunk
  
  // Split script into words first
  const words = script.split(/(\s+)/).filter(w => w.trim().length > 0);
  
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentLine = '';
  let currentLineLength = 0;
  let currentChunkLength = 0;
  
  for (const word of words) {
    const wordLength = word.length;
    const testLineLength = currentLineLength + (currentLine ? 1 : 0) + wordLength; // +1 for space
    
    if (testLineLength <= charsPerLine && currentChunkLength + testLineLength <= charsPerChunk) {
      // Word fits on current line and in current chunk
      currentLine = currentLine ? currentLine + ' ' + word : word;
      currentLineLength = testLineLength;
      currentChunkLength += wordLength + (currentLineLength > wordLength ? 1 : 0);
    } else if (currentLineLength + wordLength <= charsPerLine) {
      // Word fits on current line but chunk is full, start new chunk
      if (currentLine) {
        currentChunk.push(currentLine);
      }
      if (currentChunk.length === 3) {
        chunks.push([...currentChunk]);
        currentChunk = [];
        currentChunkLength = 0;
      }
      currentLine = word;
      currentLineLength = wordLength;
      currentChunkLength = wordLength;
    } else {
      // Word doesn't fit on current line
      if (currentLine) {
        currentChunk.push(currentLine);
        if (currentChunk.length === 3) {
          chunks.push([...currentChunk]);
          currentChunk = [];
          currentChunkLength = 0;
        }
      }
      // Check if word fits on a new line
      if (wordLength <= charsPerLine) {
        currentLine = word;
        currentLineLength = wordLength;
        currentChunkLength = wordLength;
      } else {
        // Word is too long, split it (shouldn't happen often)
        currentLine = word.substring(0, charsPerLine);
        currentLineLength = charsPerLine;
        currentChunkLength = charsPerLine;
      }
    }
  }
  
  // Add remaining line
  if (currentLine) {
    currentChunk.push(currentLine);
  }
  
  // Add last chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks.length > 0 ? chunks : [[script]];
}

/**
 * Calculates which 3-line chunk to show based on audio progress
 */
function calculateVisibleChunk(
  chunks: string[][],
  currentTime: number,
  duration: number
): string[] {
  if (chunks.length === 0) {
    return [];
  }
  
  if (duration === 0 || chunks.length === 1) {
    return chunks[0] || [];
  }
  
  // Calculate progress percentage
  const progress = Math.min(Math.max(currentTime / duration, 0), 1);
  
  // Calculate which chunk index we should be at
  const targetIndex = Math.floor(progress * chunks.length);
  const chunkIndex = Math.min(targetIndex, chunks.length - 1);
  
  return chunks[chunkIndex] || chunks[0] || [];
}

export function CaptionOverlay({
  script,
  currentTime,
  duration,
  onClose,
}: CaptionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const fontSize = 16;
  const lineHeight = 1.6;

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 48); // Account for padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const visibleLines = useMemo(() => {
    if (!script || containerWidth === 0) {
      return [];
    }
    
    const chunks = splitScriptIntoThreeLineChunks(script, containerWidth, fontSize);
    return calculateVisibleChunk(chunks, currentTime, duration);
  }, [script, currentTime, duration, containerWidth, fontSize]);

  if (visibleLines.length === 0) {
    return null;
  }

  // Ensure we always show exactly 3 lines (pad with empty strings if needed)
  const displayLines = [...visibleLines];
  while (displayLines.length < 3) {
    displayLines.push('');
  }
  const finalLines = displayLines.slice(0, 3);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        pointerEvents: "none",
      }}
    >
      {/* Transparent mask background - visual only, doesn't block clicks */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(11,15,26,.95) 0%, transparent 30%, transparent 70%, rgba(11,15,26,.95) 100%)",
          pointerEvents: "none", // Allow clicks to pass through
        }}
      />
      
      {/* Caption content - only this blocks pointer events */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          pointerEvents: "auto", // Only the caption box is interactive
          background: "rgba(0, 0, 0, 0.7)",
          borderRadius: 12,
          padding: "20px 24px",
          paddingTop: "40px", // Space for close button
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Close button - top right of script area */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 24,
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
            opacity: 0.8,
            zIndex: 1001,
          }}
          aria-label="Schließen"
        >
          ×
        </button>
        
        {/* Exactly 3 lines of script */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            height: `${Math.ceil(fontSize * lineHeight * 3)}px`, // Exactly 3 lines height
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {finalLines.map((line, index) => (
            <div
              key={`line-${index}-${currentTime.toFixed(1)}`}
              style={{
                margin: 0,
                padding: 0,
                color: "white",
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}`,
                textAlign: "center",
                height: `${Math.ceil(fontSize * lineHeight)}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                opacity: index === 0 && line ? 1 : line ? 0.9 : 0.3, // Top line (current) is fully visible
              }}
            >
              {line || '\u00A0'} {/* Non-breaking space if empty */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
