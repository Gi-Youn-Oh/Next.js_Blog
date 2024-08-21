"use server";

import {checkSession} from "@/utils/session";
import {supabase} from "@/utils/superbase";
import {revalidatePath} from "next/cache";

type actionResponse = {
    status: number;
    message?: string;
};

export async function addComment(formData: FormData, userName: string, userId: string, slug: string): Promise<actionResponse> {
    const sessionResponse = await checkSession();
    if (sessionResponse) {
        return sessionResponse;
    }

    const content = formData.get('content');
    if (!content || (typeof content === 'string' && content.trim().length === 0)) {
        return {status: 400, message: '댓글을 입력해주세요'};
    }

    const {data, error, status} = await supabase
        .from('comment')
        .insert([
            {created_at: new Date(), name: userName, comment: content, token_id: userId, post_path: slug},
        ])
        .select();

    if (error) {
        throw new Error('댓글 작성에 실패했습니다');
    }

    if (status === 201) {
        revalidatePath(`/posts/${slug}`);
    }
    return {status: 201, message: '댓글이 작성되었습니다'};
}

export async function updateComment(
    created_at: string,
    updatedComment: string,
    post_path: string
): Promise<actionResponse> {

    const sessionResponse = await checkSession();
    if (sessionResponse) {
        return sessionResponse;
    }

    const {error} = await supabase
        .from("comment")
        .update({comment: updatedComment})
        .eq("created_at", created_at)
        .select();

    if (error) {
        return {status: 500, message: "댓글 수정에 실패했습니다."}
    }

    revalidatePath(`/api/posts/${post_path}`);
    return {status: 200, message: "댓글이 수정되었습니다."};
}

export async function deleteComment(created_at: string, post_path: string): Promise<actionResponse> {

    const sessionResponse = await checkSession();
    if (sessionResponse) {
        return sessionResponse;
    }

    const {error} = await supabase
        .from("comment")
        .delete()
        .match({created_at});

    if (error) {
        return {status: 500, message: "댓글 삭제에 실패했습니다."}
            ;
    }

    revalidatePath(`/api/posts/${post_path}`);
    return {status: 200, message: "댓글이 삭제되었습니다."};
}

