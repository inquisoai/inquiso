import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Tailwind-only prose styling (no typography plugin). Links open in a new tab;
// react-markdown escapes raw HTML by default, so model output can't inject.
const PROSE = [
  'space-y-2 break-words',
  '[&_h1]:font-semibold [&_h1]:text-base [&_h2]:font-semibold [&_h3]:font-semibold',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5',
  '[&_a]:text-brand [&_a]:underline',
  '[&_strong]:font-semibold [&_em]:italic',
  '[&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface-2 [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:border-line [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-ink-dim',
  '[&_table]:block [&_table]:overflow-x-auto [&_th]:px-2 [&_th]:text-left [&_td]:px-2',
].join(' ')

interface Props {
  text: string
  className?: string
}

/** Renders model output as GitHub-flavored markdown. Safe by default —
 * react-markdown does not emit raw HTML. */
export function Markdown({ text, className = '' }: Props) {
  return (
    <div className={`${PROSE} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noreferrer" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
