import React from "react";

/**
 * Formats dialog content with bold speaker names.
 * Speaker names are identified by patterns like "Mephisto:", "Holla:", etc.
 */
export function formatDialogContent(content: string): React.ReactNode[] {
  if (!content) return [];
  
  // Split by newlines to preserve line breaks
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    if (index > 0) {
      result.push(React.createElement('br', { key: `br-${index}` }));
    }
    
    // Check if line starts with a speaker name (pattern: "Name: ")
    const speakerMatch = line.match(/^([A-Za-zäöüÄÖÜß]+):\s*(.*)$/);
    
    if (speakerMatch) {
      const [, speakerName, restOfLine] = speakerMatch;
      result.push(
        React.createElement('span', { key: `line-${index}` },
          React.createElement('strong', null, `${speakerName}:`),
          ` ${restOfLine}`
        )
      );
    } else {
      result.push(React.createElement('span', { key: `line-${index}` }, line));
    }
  });
  
  return result;
}
