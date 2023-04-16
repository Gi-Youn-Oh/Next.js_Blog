import Hero from "@/components/Hero";
import Link from "next/link";

const TITLE_CLASS = "text-2xl font-bold text-gray-800 my-4"
const CONTENT_CLASS = "text-xl font-bold text-gray-700 m-1";

export default function About() {
    return (
        <>
            <Hero/>
            <section className="bg-gray-100 shadow-lg p-8 m-8 text-center">
                <h2 className={TITLE_CLASS}>Who Am I?</h2>
                <p>개발을 즐기는 프론트엔드 개발자 <br/>
                함께 나누는 서비스를 추구하며, 사용자 경험에 가치를 두고 있습니다.
                </p>
                <h2 className={TITLE_CLASS}>Click To Link</h2>
                <div className="flex justify-center my-2">
                <Link href="https://www.notion.so/6e24c23a25bc4fa7838849ab5d777d1e">
                <h3 className={CONTENT_CLASS}>Resume |</h3>
                </Link>
                <Link href="https://www.notion.so/b87f403ff5ec4e47a7ebfc7dcfbae2d2">
                <h3 className={CONTENT_CLASS}>About Me |</h3>
                </Link>
                <Link href="https://www.notion.so/bd0bd61f95074e20b24800ed7ea7f1bb">
                <h3 className={CONTENT_CLASS}>Portfolio</h3>
                </Link>
                </div>

                <h2 className={TITLE_CLASS}>skills</h2>
                <p>HTML, CSS, JavaScript, TypeScript
                <br/>
                React, ReactNative, Redux, ReactQuery, Next
                <br/> StyledComponents, TailWind</p>
            </section>
        </>
    )
}