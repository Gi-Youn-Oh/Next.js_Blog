import Link from "next/link";
import AuthCheck from "./AuthCheck";

export default function Header() {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4">
      <Link href="/">
        <h1 className="text-3xl font-bold">{"Giyoun's Blog"}</h1>
      </Link>
      <nav className="flex flex-wrap gap-4 justify-center md:justify-start mt-4 md:mt-0">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/posts">Posts</Link>
        <Link href="/contact">Contact</Link>
        <AuthCheck />
      </nav>
    </header>
  );
}
