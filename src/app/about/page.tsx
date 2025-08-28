import Hero from "@/components/Hero";
import { MdEmojiPeople } from "react-icons/md";
import { Metadata } from "next";
import Skill from "@/components/Skill";

export const metadata: Metadata = {
    title: 'About Me',
    description: '저를 소개합니다.',
};

const TITLE_CLASS = "text-2xl font-bold text-gray-800 my-4"
const CONTENT_CLASS = "text-xl font-bold text-gray-700 m-1";

const LINKS = [
    { icon: <MdEmojiPeople />, url: "https://shell-dentist-f9a.notion.site/134d693cf9b1807a9bd4c9dabdef568b?pvs=4", description: "Resume" },
    // { icon: <SiAboutdotme />, url: "https://www.notion.so/b87f403ff5ec4e47a7ebfc7dcfbae2d2", description: "About Me" },
    // { icon: <FcDocument />, url: "https://www.notion.so/bd0bd61f95074e20b24800ed7ea7f1bb", description: "Portfolio" },
]

const SKILLS = [
    { icon: "https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=HTML5&logoColor=white" },
    { icon: "https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=CSS3&logoColor=white" },
    { icon: "https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=JavaScript&logoColor=white" },
    { icon: "https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=TypeScript&logoColor=white" }
]

const SKILLS2 = [
    { icon: "https://img.shields.io/badge/React-61DAFB?style=flat&logo=React&logoColor=white" },
    { icon: "https://img.shields.io/badge/Zustand-F58320?style=flat&logo=React&logoColor=white" },
    { icon: "https://img.shields.io/badge/Recoil-3578E5?style=flat&logo=Recoil&logoColor=white"},
    { icon: "https://img.shields.io/badge/Redux-764ABC?style=flat&logo=Redux&logoColor=white" },
    { icon: "https://img.shields.io/badge/ReactQuery-FF4154?style=flat&logo=ReactQuery&logoColor=white" },
    { icon: "https://img.shields.io/badge/Next.js-000000?style=flat&logo=Next.js&logoColor=white" },
]

const SKILLS3 = [
    { icon: "https://img.shields.io/badge/styledcomponents-DB7093?style=flat&logo=styledcomponents&logoColor=white" },
    { icon: "https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=TailwindCSS&logoColor=white" },
]

// const RECENTSTUDY = [
// ]

export default function About() {
    return (
        <>
            <Hero />
            <section className="bg-gray-100 shadow-lg p-8 m-8 text-center">
                <h2 className={TITLE_CLASS}>Who Am I?</h2>
                <p>개발을 즐기는 프론트엔드 개발자 <br />
                    사용자 중심의 가치 있는 경험을 창출하고, 효율적인 서비스 제공을 목표로 합니다.
                </p>

                <h2 className={TITLE_CLASS}>Click To Link</h2>
                <ul className="flex justify-center my-2">
                    {LINKS.map((link, index) => (
                        <a className="flex mx-2" key={index} href={link.url} target="_blank" rel='noreferrer'>
                            {link.icon}
                            <h3 className={CONTENT_CLASS}>{link.description}</h3>
                        </a>))}
                </ul>

                <h2 className={TITLE_CLASS}>skills</h2>
                <Skill skills={SKILLS} />
                <Skill skills={SKILLS2} />
                <Skill skills={SKILLS3} />
                {/*<h3 className={CONTENT_CLASS}>Recent Study</h3>*/}
                {/*<Skill skills={RECENTSTUDY} />*/}
            </section>
        </>
    )
}