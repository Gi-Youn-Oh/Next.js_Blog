import { MetadataRoute } from 'next'
import { getAllPosts } from '@/service/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const blogPosts = await getAllPosts();

    const staticUrls: MetadataRoute.Sitemap = [
        {
            url: 'https://giyoun-blog.vercel.app',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://giyoun-blog.vercel.app/about',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: 'https://giyoun-blog.vercel.app/posts',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: 'https://giyoun-blog.vercel.app/contact',
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ];

    const dynamicUrls: MetadataRoute.Sitemap = blogPosts.map(post => ({
        url: `https://giyoun-blog.vercel.app/posts/${post.path}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly', // 타입에 맞는 값 사용
        priority: 0.8,
    }));

    return [...staticUrls, ...dynamicUrls];
}
