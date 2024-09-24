import { Post } from "@/app/service/posts";
import Image from "next/image";
import Link from "next/link";

type Props = { post: Post };
export default function PostCard({ post: { title, description, date, category, path } }: Props) {
    return <Link href={`/posts/${path}`}>
        <article className="rounded-md overflow-hidden shadow-md hover:shadow-xl">
        <Image className="w-full" src={`/images/posts/${path}.png`} alt={title} width={300} height={200} quality={100}/>
        <div className="flex flex-col items-center p-4">
            <time className="self-end test-gray-700">{date.toString()}</time>
            <h3 className="w-full text-center text-lg truncate font-bold">{title}</h3>
            <p className="w-full truncate text-center">{description}</p>
            <span className="text-sm rounded-lg bg-green-100 px-2 my-2">{category}</span>
        </div>
        </article>
    </Link>
}