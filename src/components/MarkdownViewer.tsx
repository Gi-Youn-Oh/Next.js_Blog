'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'
import rehypeRaw from 'rehype-raw'

// import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'

export default function MarkdownViewer({ content }: { content: string }) {
    return <ReactMarkdown className="prose max-w-none lg:prose-lg" remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
        components={{
            code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                    <SyntaxHighlighter
                        {...props}
                        style={coldarkDark}
                        language={match[1]}
                        PreTag="div"
                        // wrapLines={true}
                        wrapLongLines={true}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                ) : (
                    <code {...props} className={className}>
                        {children}
                    </code>
                )
            },
            img: (image) => <Image className="w-full max-h-70 object-cover" src={image.src || ""} alt={image.alt || ""} width={1000} height={700} quality={100} />
        }}
    >
        {content}
    </ReactMarkdown>
}