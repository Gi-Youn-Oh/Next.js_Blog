"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Image from "next/image";
import rehypeRaw from "rehype-raw";

export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose max-w-none break-words lg:prose-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }:any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                style={coldarkDark}
                language={match[1]}
                PreTag="div"
                // wrapLines={true}
                wrapLongLines={true}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
          img: (image: any) => (
            <Image
              className={
                image.alt === "exception"
                  ? "w-full h-auto max-w-[1500px]"
                  : "w-full h-auto max-w-[900px]"
              }
              src={image.src || ""}
              alt={image.alt || ""}
              width={1000}
              height={700}
              quality={100}
              unoptimized={image.alt === "exception" ? true : false}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
