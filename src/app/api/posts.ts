import { readFile } from "fs/promises";
import path from "path";

export type Post = {
    title: string;
    description: string;
    date: Date;
    category: string;
    path: string;
    recent: boolean;
}

export async function getRecentPosts(): Promise<Post[]> {
    return getAllPosts()
        .then(posts => posts.filter(post => post.recent))
}

export async function getAllPosts(): Promise<Post[]> {
    const filePath = path.join(process.cwd(), 'data', 'posts.json');
    return readFile(filePath, 'utf-8')
        // .then(data => JSON.parse(data))
        .then<Post[]>(JSON.parse) //  생략, json parse type 설정 즉 posts의 타입
        .then(posts => posts.sort((a, b) => (a.date > b.date ? -1 : 1))) // 날짜 정렬
}