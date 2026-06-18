import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

type Part =
  | { type: 'text'; content: string }
  | { type: 'inline'; content: string }
  | { type: 'block'; content: string };

function parseLatex(text: string): Part[] {
  const parts: Part[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Try $$...$$ (block) first — must check before $...$
    const blockDollar = remaining.indexOf('$$');
    const blockBracket = remaining.indexOf('\\[');
    const inlineDollar = remaining.indexOf('$');
    const inlineParen = remaining.indexOf('\\(');

    // Find the earliest match
    const candidates: { index: number; type: 'block-dollar' | 'block-bracket' | 'inline-dollar' | 'inline-paren' }[] = [];
    if (blockDollar !== -1) candidates.push({ index: blockDollar, type: 'block-dollar' });
    if (blockBracket !== -1) candidates.push({ index: blockBracket, type: 'block-bracket' });
    if (inlineDollar !== -1 && inlineDollar !== blockDollar) candidates.push({ index: inlineDollar, type: 'inline-dollar' });
    if (inlineParen !== -1) candidates.push({ index: inlineParen, type: 'inline-paren' });

    if (candidates.length === 0) {
      parts.push({ type: 'text', content: remaining });
      break;
    }

    // Sort by earliest index, prefer block over inline when tied
    candidates.sort((a, b) => {
      if (a.index !== b.index) return a.index - b.index;
      // prefer block types
      const isBlockA = a.type.startsWith('block');
      const isBlockB = b.type.startsWith('block');
      return isBlockA ? -1 : isBlockB ? 1 : 0;
    });

    const best = candidates[0];

    // Push text before the match
    if (best.index > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, best.index) });
      remaining = remaining.slice(best.index);
    }

    if (best.type === 'block-dollar') {
      const end = remaining.indexOf('$$', 2);
      if (end === -1) {
        parts.push({ type: 'text', content: remaining });
        break;
      }
      parts.push({ type: 'block', content: remaining.slice(2, end) });
      remaining = remaining.slice(end + 2);
    } else if (best.type === 'block-bracket') {
      const end = remaining.indexOf('\\]', 2);
      if (end === -1) {
        parts.push({ type: 'text', content: remaining });
        break;
      }
      parts.push({ type: 'block', content: remaining.slice(2, end) });
      remaining = remaining.slice(end + 2);
    } else if (best.type === 'inline-dollar') {
      const end = remaining.indexOf('$', 1);
      if (end === -1) {
        parts.push({ type: 'text', content: remaining });
        break;
      }
      parts.push({ type: 'inline', content: remaining.slice(1, end) });
      remaining = remaining.slice(end + 1);
    } else {
      // inline-paren
      const end = remaining.indexOf('\\)', 2);
      if (end === -1) {
        parts.push({ type: 'text', content: remaining });
        break;
      }
      parts.push({ type: 'inline', content: remaining.slice(2, end) });
      remaining = remaining.slice(end + 2);
    }
  }

  return parts.filter(p => p.content.length > 0);
}

export function RenderMath({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  const parts = parseLatex(text);

  const hasBlock = parts.some(p => p.type === 'block');

  if (hasBlock) {
    return (
      <div className={className}>
        {parts.map((part, i) => {
          if (part.type === 'block') {
            return (
              <div key={i} className="my-1 overflow-x-auto">
                <BlockMath math={part.content} />
              </div>
            );
          }
          if (part.type === 'inline') {
            return <InlineMath key={i} math={part.content} />;
          }
          return <span key={i}>{part.content}</span>;
        })}
      </div>
    );
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'inline') {
          return <InlineMath key={i} math={part.content} />;
        }
        return <span key={i}>{part.content}</span>;
      })}
    </span>
  );
}

export function RenderEquation({ equation }: { equation: string }) {
  const stripped = equation
    .trim()
    .replace(/^\$\$([\s\S]*)\$\$$/, '$1')
    .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
    .replace(/^\$([\s\S]*)\$$/, '$1')
    .trim();

  return (
    <div className="overflow-x-auto py-1">
      <BlockMath math={stripped} />
    </div>
  );
}
