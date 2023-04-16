import { getPostData } from "@/app/api/posts";
import AdjacentPostCard from "@/components/AdjacentPostCard";
import PostContent from "@/components/PostContent";
import Image from "next/image";

type Props = {
    params: {
        slug: string;
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
        <section className="flex shadow-md">
            {prev && <AdjacentPostCard post={prev} type='prev' />}
            {next && <AdjacentPostCard post={next} type='next' />}
        </section>
    </article>
}