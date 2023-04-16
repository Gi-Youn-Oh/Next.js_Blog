'use client'

import { ChangeEvent, FormEvent, useState } from 'react';
import { BannerData } from './Banner';
import Banner from './Banner';

type Form = {
    from: string;
    subject: string;
    message: string;
}

export default function ContactForm() {
    const [form, setForm] = useState<Form>({ from: '', subject: '', message: '' });
    const [banner, setBanner] = useState<BannerData | null>(null);

    const onChange= (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
    }

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // console.log(form);
        setBanner({message: '메일 전송이 완료되었습니다!', state: 'success'});
        setTimeout(() => {
            setBanner(null);
        }, 3000)
    }
    return (
        <section className="w-full max-w-md">
        {banner && <Banner banner={banner} />}
            <form onSubmit={onSubmit} className="w-full flex flex-col gap-2 my-4 p-4 bg-slate-800 rounded-xl text-white">
                <label htmlFor='from' className="font-semibold">
                    Your email
                </label>
                <input className="text-black" type="email" id="from" name="from" required autoFocus value={form.from} onChange={onChange} />
                <label htmlFor='subject' className="font-semibold">
                    Subject
                </label>
                <input className="text-black" type="text" id="subject" name="subject" required value={form.subject} onChange={onChange} />
                <label htmlFor='message' className="font-semibold">
                    Message
                </label>
                <textarea className="text-black" rows={10} id="message" name="message" required value={form.message} onChange={onChange} />
                <button type="submit" className="font-semibold bg-yellow-300 text-black hover:bg-yellow-400">Send</button>
            </form>
        </section>
    );
}