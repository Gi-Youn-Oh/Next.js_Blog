'use client'

import PostComment from "./PostComment";
import {addComment} from "@/app/actions";
import {useRef} from "react";
import {useSession} from "next-auth/react";

type Prop = {
    slug: string;
};

export default function CommentInput({slug}: Prop) {
    const formRef = useRef<HTMLFormElement>(null)
    const clientSession = useSession();
    const userName = clientSession?.data?.user?.name || '';
    const userId = clientSession?.data?.user?.id || '';

    return (
        <div className="m-5">
            <form ref={formRef} action={async formData => {
                await addComment(formData, userName, userId, slug);
                formRef.current?.reset();
            }}>
                <textarea className="w-full h-24 p-2 border border-gray-300 rounded-lg" placeholder="댓글을 입력해주세요"
                          name="content"/>
                <PostComment/>
            </form>
        </div>
    )
}
