import { getPostData, getRecentPosts } from "@/service/posts";
import AdjacentPostCard from "@/components/posts/AdjacentPostCard";
import Comments from "@/components/comments/Comments";
import PostContent from "@/components/posts/PostContent";
import { Metadata } from "next";
import Image from "next/image";

type Props = {
    params: Promise<{
        slug: string;
    }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;

    const {
        slug
    } = params;

    const {title, description, path} = await getPostData(slug);
    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: `/images/posts/${path}.png`,
                    width: 760,
                    height: 420,
                    alt: title,
                }
            ]
        }
    }
}

export async function generateStaticParams() {
    const posts = await getRecentPosts();
    return posts.map(post => ({
        slug:post.path,
    }))
}

export default async function PostPage(props: Props) {
    const params = await props.params;

    const {
        slug
    } = params;

    // 1. 전달된 slug에 해당하는 포스트 데이터 읽어오기
    // 2. 데이터를 마크다운 뷰어에 표기
    const post = await getPostData(slug);
    const { title, path, next, prev } = post;
    return <article className="rounded-2xl overflow-hidden bg-gray-100 shadow-lg m-4">
        <Image className="w-full h-1/5 max-h-[500px]" src={`/images/posts/${path}.png`} alt={title} width={760} height={420} priority/>
        <PostContent post={post} />
        <Comments slug={slug} />
        <section className="flex shadow-md">
            {prev && <AdjacentPostCard post={prev} type='prev' />}
            {next && <AdjacentPostCard post={next} type='next' />}
        </section>
    </article>
}

