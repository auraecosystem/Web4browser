'use client';
import React from 'react';

interface MarkdownTextProps {
  text: string;
}

export default function MarkdownText({ text }: MarkdownTextProps) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm text-zinc-200 leading-relaxed">
      {lines.map((line, lineIdx) => {
        let currentLine = line;

        // 1. Structural Bullet Check
        const isBullet = currentLine.trim().startsWith('- ') || currentLine.trim().startsWith('* ');
        if (isBullet) {
          currentLine = currentLine.replace(/^(\s*[-*]\s+)/, '');
        }

        // 2. Tokenize Bold (**text**) and Hyperlink ([text](url)) Elements
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
        const tokens = currentLine.split(regex);

        tokens.forEach((token, tokenIdx) => {
          const uniqueKey = `${lineIdx}-${tokenIdx}`;

          if (token.startsWith('**') && token.endsWith('**')) {
            // Bold element render block
            const cleanBoldText = token.slice(2, -2);
            parts.push(<strong key={uniqueKey} className="font-bold text-white text-zinc-100">{cleanBoldText}</strong>);
          } else if (token.startsWith('[') && token.includes('](')) {
            // Anchor element extraction block
            const closingBracketIdx = token.indexOf(']');
            const anchorText = token.slice(1, closingBracketIdx);
            const targetUrl = token.slice(closingBracketIdx + 2, -1);
            parts.push(
              <a 
                key={uniqueKey} 
                href={targetUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 font-medium underline transition"
              >
                {anchorText}
              </a>
            );
          } else {
            // Regular standard fragment plain text push
            parts.push(token);
          }
        });

        // 3. Assemble and return wrapped layout block structure
        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start space-x-2 pl-4">
              <span className="text-emerald-500 mt-1.5 text-xs select-none">•</span>
              <span className="flex-1">{parts}</span>
            </div>
          );
        }

        return currentLine.trim() === '' ? <div key={lineIdx} className="h-2" /> : <p key={lineIdx}>{parts}</p>;
      })}
    </div>
  );
}
