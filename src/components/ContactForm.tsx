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
        <>
        {banner && <Banner banner={banner} />}
            <form onSubmit={onSubmit}>
                <label htmlFor='from'>
                    Your email
                </label>
                <input type="email" id="from" name="from" required autoFocus value={form.from} onChange={onChange} />
                <label htmlFor='subject'>
                    Subject
                </label>
                <input type="text" id="subject" name="subject" required value={form.subject} onChange={onChange} />
                <label htmlFor='message'>
                    Message
                </label>
                <textarea rows={10} id="message" name="message" required value={form.message} onChange={onChange} />
                <button type="submit">Send</button>
            </form>
        </>
    );
}