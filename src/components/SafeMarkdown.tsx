import { Fragment, useId, useState } from 'react';
import { Link } from 'react-router';
import type { Block, Inline } from '../lib/markdown';
import styles from './SafeMarkdown.module.css';

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'text':
            return <Fragment key={i}>{node.text}</Fragment>;
          case 'strong':
            return (
              <strong key={i}>
                <InlineNodes nodes={node.children} />
              </strong>
            );
          case 'em':
            return (
              <em key={i}>
                <InlineNodes nodes={node.children} />
              </em>
            );
          case 'code':
            return <code key={i}>{node.text}</code>;
          case 'link':
            return node.href.startsWith('/') ? (
              <Link key={i} to={node.href}>
                <InlineNodes nodes={node.children} />
              </Link>
            ) : (
              <a key={i} href={node.href} target={node.href.startsWith('#') ? undefined : '_blank'} rel="noreferrer">
                <InlineNodes nodes={node.children} />
              </a>
            );
        }
      })}
    </>
  );
}

function ChecklistItem({ children }: { children: Inline[] }) {
  const id = useId();
  const [done, setDone] = useState(false);
  return (
    <li className={styles.check}>
      <input id={id} type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
      <label htmlFor={id} className={done ? styles.done : undefined}>
        <InlineNodes nodes={children} />
      </label>
    </li>
  );
}

/** Renders parsed Markdown as React elements. There is no HTML path. */
export function SafeMarkdown({ blocks }: { blocks: Block[] }) {
  return (
    <div className={styles.prose}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 2 ? 'h2' : 'h3';
            return (
              <Tag key={i} id={block.id}>
                <InlineNodes nodes={block.children} />
              </Tag>
            );
          }
          case 'paragraph':
            return (
              <p key={i}>
                <InlineNodes nodes={block.children} />
              </p>
            );
          case 'callout':
            return (
              <aside key={i} className={styles.callout}>
                <InlineNodes nodes={block.children} />
              </aside>
            );
          case 'list': {
            const checklist = block.items.every((item) => item.checkbox);
            const Tag = block.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i} className={checklist ? styles.checklist : undefined}>
                {block.items.map((item, j) =>
                  checklist ? (
                    <ChecklistItem key={j}>{item.children}</ChecklistItem>
                  ) : (
                    <li key={j}>
                      <InlineNodes nodes={item.children} />
                    </li>
                  ),
                )}
              </Tag>
            );
          }
        }
      })}
    </div>
  );
}
