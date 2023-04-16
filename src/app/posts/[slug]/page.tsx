import { getPostData } from "@/app/api/posts";
import MarkdownViewer from "@/components/MarkdownViewer";
import Image from "next/image";
import {AiTwotoneCalendar} from 'react-icons/ai';

type Props = {
    params: {
        slug: string;
    }
}

export default async function PostPage({ params: { slug } }: Props) {
    // 1. 전달된 slug에 해당하는 포스트 데이터 읽어오기
    // 2. 데이터를 마크다운 뷰어에 표기

    const {title, description, date, path, content} = await getPostData(slug);
    return <article className="rounded-2xl overflow-hidden bg-gray-100 shadow-lg m-4">
        <Image className="w-full h-1/5 max-h-[500px]" src={`/images/posts/${path}.png`} alt = {title} width = {760} height={420} />
        <section className="flex flex-col p-4">
            <div className="flex items-center self-end text-sky-600">
                <AiTwotoneCalendar />
                <p className="font-semibold ml-2">{date.toString()}</p>
            </div>
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-xl font-bold">{description}</p>
        <div className="w-44 border-2 border-sky-600 mt-4 mb-8"></div>
        <MarkdownViewer content = {content} />
        </section>
    </article>
}