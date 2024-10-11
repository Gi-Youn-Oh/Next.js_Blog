import FilterablePosts from "@/components/FilterablePosts";
import { getAllPosts } from "@/service/posts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'All Posts',
    description: '모든 블로그 글',
};

export default async function PostsPage() {
    const posts= await getAllPosts();
    const categories = [... new Set(posts.map(post => post.category))];
    return <FilterablePosts posts={posts} categories={categories} />
}