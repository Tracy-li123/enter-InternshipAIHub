import React from 'react';

interface Props {
  text: string;
  className?: string;
}

interface Token {
  type: 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'paragraph' | 'empty';
  content: string;
  index?: number; // for numbered items
}

function parseLine(line: string): Token {
  if (!line.trim()) return { type: 'empty', content: '' };
  if (/^#{3}\s+/.test(line)) return { type: 'heading3', content: line.replace(/^#{3}\s+/, '') };
  if (/^#{2}\s+/.test(line)) return { type: 'heading2', content: line.replace(/^#{2}\s+/, '') };
  if (/^#{1}\s+/.test(line)) return { type: 'heading1', content: line.replace(/^#{1}\s+/, '') };
  const bulletMatch = line.match(/^[-*•]\s+(.+)/);
  if (bulletMatch) return { type: 'bullet', content: bulletMatch[1] };
  const numberedMatch = line.match(/^(\d+)[.、)]\s+(.+)/);
  if (numberedMatch) return { type: 'numbered', content: numberedMatch[2], index: parseInt(numberedMatch[1]) };
  return { type: 'paragraph', content: line };
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|【[^】]+】|「[^」]+」)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (/^【[^】]+】$/.test(part) || /^「[^」]+」$/.test(part)) {
      return <strong key={i} className="font-semibold text-foreground">{part}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function JobDescriptionRenderer({ text, className = '' }: Props) {
  if (!text) return null;

  const lines = text.split('\n');
  const tokens = lines.map(parseLine);

  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'empty') {
      i++;
      continue;
    }

    if (token.type === 'heading1') {
      nodes.push(
        <h2 key={i} className="text-xl font-bold text-foreground mt-5 mb-2 first:mt-0">
          {renderInline(token.content)}
        </h2>
      );
      i++;
      continue;
    }

    if (token.type === 'heading2') {
      nodes.push(
        <h3 key={i} className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0">
          {renderInline(token.content)}
        </h3>
      );
      i++;
      continue;
    }

    if (token.type === 'heading3') {
      nodes.push(
        <h4 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {renderInline(token.content)}
        </h4>
      );
      i++;
      continue;
    }

    // Collect consecutive bullet items
    if (token.type === 'bullet') {
      const items: string[] = [];
      while (i < tokens.length && tokens[i].type === 'bullet') {
        items.push(tokens[i].content);
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Collect consecutive numbered items
    if (token.type === 'numbered') {
      const items: string[] = [];
      let num = 1;
      while (i < tokens.length && tokens[i].type === 'numbered') {
        items.push(tokens[i].content);
        i++;
        num++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/90">
              <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold leading-none mt-0.5">
                {j + 1}
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={i} className="text-sm text-foreground/85 leading-relaxed my-1">
        {renderInline(token.content)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-0.5 ${className}`}>{nodes}</div>;
}
