import { getNotRecentPosts } from "@/app/service/posts"
import PostCard from "./PostCard";
import MultiCarousel from "./MultiCarousel";

export default async function CarouselPosts() {
    const posts = await getNotRecentPosts();
    return <section className="my-4">
        <h2 className="text-2xl font-bold my-2">Other Posts</h2>
        <MultiCarousel>
        {posts.map(post => <PostCard key={post.path} post={post} /> )}
        </MultiCarousel>
    </section>
}