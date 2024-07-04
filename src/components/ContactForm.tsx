'use client'

import { ChangeEvent, FormEvent, useState } from 'react';
import { BannerData } from './Banner';
import Banner from './Banner';
import { sendContactEmail } from '@/app/service/contact';

type Form = {
    from: string;
    subject: string;
    message: string;
}

const DEFAULT_DATA = { from: '', subject: '', message: '' };

export default function ContactForm() {
    const [form, setForm] = useState<Form>(DEFAULT_DATA);
    const [banner, setBanner] = useState<BannerData | null>(null);

    const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // console.log(form);
        sendContactEmail(form)
            .then(() => {
                setBanner({ message: '메일 전송이 완료되었습니다!', state: 'success' });
                setForm(DEFAULT_DATA);
            })
            .catch(() => {
                setBanner({ message: '메일 전송이 실패했습니다. 다시 시도해 주세요.', state: 'error' });
            })
            .finally(() => {
                setTimeout(() => {
                    setBanner(null);
                }, 3000);
            });
        };

        return (
            <section className="w-full max-w-md">
                {banner && <Banner banner={banner} />}
                <form onSubmit={onSubmit} className="w-full flex flex-col gap-2 my-4 p-4 bg-gray-500 rounded-xl text-white">
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
                    <button type="submit" className="font-semibold 
                    text-white bg-gray-400 hover:bg-blue-500 ">Send</button>
                </form>
            </section>
        );
    }