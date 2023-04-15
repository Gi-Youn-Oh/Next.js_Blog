import Link from 'next/link'

export default function Header() {
    return <header>
        <Link href="/">
            <h1>{"Giyoun's Blog"}</h1>
        </Link>
        <nav>
            <Link href="/" >Home</Link>
            <Link href="/about" >About</Link>
            <Link href="/posts" >Posts</Link>
            <Link href="/contact" >Contact</Link>
        </nav>
    </header>
}