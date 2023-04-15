import Hero from '@/components/Hero'
import RecentPosts from '@/components/RecentPosts'


export default function HomePage() {
  return (
    <>
      <Hero />
      {/* @ts-expect-error Async Server Component */}
      <RecentPosts />
    </>
  )
}
