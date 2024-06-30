import { getPostData, getRecentPosts } from "@/app/service/posts";
import AdjacentPostCard from "@/components/AdjacentPostCard";
import Comments from "@/components/Comments";
import PostContent from "@/components/PostContent";
import { Metadata } from "next";
import Image from "next/image";

type Props = {
    params: {
        slug: string;
    }
}

export async function generateMetadata({ params: { slug } }: Props): Promise<Metadata>{
    const {title, description} = await getPostData(slug);
    return {
        title: title,
        description: description
    }
}

export default async function PostPage({ params: { slug } }: Props) {
    // 1. 전달된 slug에 해당하는 포스트 데이터 읽어오기
    // 2. 데이터를 마크다운 뷰어에 표기
    const post = await getPostData(slug);
    const { title, path, next, prev } = post;

    return <article className="rounded-2xl overflow-hidden bg-gray-100 shadow-lg m-4">
        <Image className="w-full h-1/5 max-h-[500px]" src={`/images/posts/${path}.png`} alt={title} width={760} height={420} />
        <PostContent post={post} />
        <Comments slug={slug} />
        <section className="flex shadow-md">
            {prev && <AdjacentPostCard post={prev} type='prev' />}
            {next && <AdjacentPostCard post={next} type='next' />}
        </section>
    </article>
}

export async function generateStaticParams() {
    const posts = await getRecentPosts();
    return posts.map(post => ({
        slug:post.path,
    }))
}