import Image from "next/image";
import profileImage from "../../public/images/profile.jpg";
import Link from "next/link";

export default function Hero() {
    return <section className="text-center">
        <Image className="rounded-full mx-auto" src={profileImage} alt="Picture of the author" width={250} height={250} priority quality={100}/>
        <h2 className="text-3xl font-bold mt-2">{"Hi, I'm Giyoun"}</h2>
        <h3 className="text-xl font-semibold">Front-End Engineer</h3>
        <p>함께 나누는 서비스를 추구하는 개발자, 오기윤입니다.</p>
        <Link href="/contact">
            <button className="bg-yellow-500 font-bold rounded-xl py-1 px-4 mt-2">Contact Me</button>
        </Link>
    </section>
}
