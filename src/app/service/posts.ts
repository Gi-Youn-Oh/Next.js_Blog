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

export async function getNotRecentPosts(): Promise<Post[]> {
    return getAllPosts()
        .then(posts => posts.filter(post => !post.recent))
}

export async function getAllPosts(): Promise<Post[]> {
    const filePath = path.join(process.cwd(), 'data', 'posts.json'); // metadata
    return readFile(filePath, 'utf-8')
        // .then(data => JSON.parse(data))
        .then<Post[]>(JSON.parse) //  생략, json parse type 설정 즉 posts의 타입
        .then(posts => posts.sort((a, b) => (a.date > b.date ? -1 : 1))) // 날짜 정렬
}

export type PostData = Post & { content: string; next: Post | null; prev: Post | null };

// 실제 md 파일 읽어오기
export async function getPostData(fileName: string): Promise<PostData> {
    const filePath = path.join(process.cwd(), 'data', 'posts', `${fileName}.md`);
    const posts = await getAllPosts();
    const post = posts.find(post => post.path === fileName);

    if (!post) {
        throw new Error(`${fileName}에 해당하는 포스트를 찾을 수 없음`);
    }

    const index = posts.indexOf(post);
    const next = index > 0 ? posts[index - 1] : null;
    const prev = index < posts.length-1? posts[index + 1] : null;
    const content = await readFile(filePath, 'utf-8');
    return { ...post, content, next, prev };
}