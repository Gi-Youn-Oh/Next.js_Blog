'use client'

import { Post } from "@/service/posts";
import { useState } from "react";
import PostsGrid from "./posts/PostsGrid";
import Categories from "./Categories";

type Props = {
    posts: Post[];
    categories: string[];
}

const ALL_POSTS = 'All Posts';

export default function FilterablePosts({posts, categories}: Props){
    const [selected, setSelected] = useState(ALL_POSTS);
    const filtered = selected === ALL_POSTS ? posts : posts.filter(post => post.category === selected);
    return <section className="flex m-4">
        <div className="flex-grow">
        <PostsGrid posts={filtered} />
        </div> 
        <Categories categories={[ALL_POSTS, ...categories]} selected={selected} onClick={(selected) => setSelected(selected)} />
    </section>
}