import { getRecentPosts } from "@/app/api/posts";
import PostsGrid from "./PostsGrid";

export default async function RecentPosts() {
    // 포스트 데이터를 읽어오기
    const posts = await getRecentPosts();
    // 포스트 데이터를 렌더

    return <section>
        <h2 className="text-2xl font-bold my-2">Recent Posts</h2>
        <PostsGrid posts={posts} />
    </section>
}