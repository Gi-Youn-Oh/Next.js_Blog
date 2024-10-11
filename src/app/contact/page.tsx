import ContactForm from '@/components/ContactForm'
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai'
import { ImInstagram } from 'react-icons/im'
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Contact Me',
    description: 'GitHub, Mail',
};

const LINKS = [
    { icon: <AiFillGithub />, url: "https://github.com/Gi-Youn-Oh", description: "링크 클릭" },
    { icon: <ImInstagram />, url: "https://www.instagram.com/gy.0623/" },
]

export default function Contact() {
    return (
        <section className="flex flex-col items-center">
            <h2 className="text-3xl font-bold my-2">Contact Me!</h2>
            <p className="font-semibold">dhrldbs2679@gmail.com</p>
            <ul className="flex gap-6 my-2">
                {LINKS.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel='noreferrer' className="text-5xl hover:text-blue-500">
                        {link.icon}
                    </a>
                ))}
            </ul>
            <h2 className="text-3xl font-bold my-8">Or Send me an email</h2>
            <ContactForm />
        </section>
    )
}