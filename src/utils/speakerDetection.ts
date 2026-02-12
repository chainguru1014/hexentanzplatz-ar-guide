/**
 * Speaker detection utilities for dialog scripts
 */

export type Speaker = "MEPHISTO" | "HOLLA" | null;

export type DialogLine = {
  text: string;
  speaker: Speaker;
  start: number;
  end: number | null; // null means it extends to the next line or end
};

/**
 * Parses dialog content into lines with speaker information
 */
export function parseDialogScript(script: string): DialogLine[] {
  if (!script || !script.trim()) return [];

  const lines = script.split('\n').filter(line => line.trim());
  const result: DialogLine[] = [];
  let currentSpeaker: Speaker = null;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    let speaker: Speaker = null;

    if (trimmed.startsWith("Mephisto:")) {
      speaker = "MEPHISTO";
    } else if (trimmed.startsWith("Holla:")) {
      speaker = "HOLLA";
    } else {
      // Keep previous speaker if line doesn't start with speaker name
      speaker = currentSpeaker;
    }

    if (speaker) {
      currentSpeaker = speaker;
    }

    result.push({
      text: trimmed,
      speaker: speaker || currentSpeaker,
      start: index, // Will be converted to time later
      end: index + 1,
    });
  });

  return result;
}

/**
 * Converts dialog lines to time-based lines
 * Estimates timing based on text length (rough estimate: ~150 words per minute)
 */
export function convertToTimeBasedLines(
  lines: DialogLine[],
  totalDuration: number
): DialogLine[] {
  if (lines.length === 0 || totalDuration <= 0) return lines;

  // Estimate: ~150 words per minute = 2.5 words per second
  const wordsPerSecond = 2.5;
  let currentTime = 0;

  return lines.map((line, index) => {
    const wordCount = line.text.split(/\s+/).filter(w => w.length > 0).length;
    const estimatedDuration = wordCount / wordsPerSecond;
    const start = currentTime;
    const end = index < lines.length - 1 ? start + estimatedDuration : null;

    currentTime += estimatedDuration;

    // Ensure we don't exceed total duration
    if (end !== null && end > totalDuration) {
      return { ...line, start, end: totalDuration };
    }

    return { ...line, start, end };
  });
}

/**
 * Gets the active speaker at a given time
 */
export function getSpeakerAtTime(
  lines: DialogLine[],
  time: number
): Speaker {
  if (lines.length === 0) return null;

  // Find the active line
  let activeLine: DialogLine | null = null;

  for (const line of lines) {
    if (line.start <= time) {
      if (line.end === null || time < line.end) {
        activeLine = line;
        break;
      }
      // If this line has ended, continue to find the next one
      activeLine = line; // Keep track of last line we passed
    } else {
      // We've passed all lines, use the last one
      break;
    }
  }

  // If no active line found but we have lines, use the last line
  if (!activeLine && lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    if (time >= lastLine.start) {
      activeLine = lastLine;
    }
  }

  return activeLine?.speaker || null;
}

/**
 * Helper to get speaker from a single line of text
 */
export function parseSpeaker(text: string): Speaker {
  const trimmed = text.trim();
  if (trimmed.startsWith("Mephisto:")) return "MEPHISTO";
  if (trimmed.startsWith("Holla:")) return "HOLLA";
  return null;
}
