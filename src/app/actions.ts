"use server";

import { checkSession } from "@/utils/session";
import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";

type actionResponse = {
  status: number;
  message?: string;
};

export async function deleteComment(created_at: string, post_path: string): Promise<actionResponse> {

  const sessionResponse = await checkSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  const { error } = await supabase
    .from("comment")
    .delete()
    .match({ created_at });

  if (error) {
    return { status: 500, message: "댓글 삭제에 실패했습니다." }
      ;
  }

  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 삭제되었습니다." };
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

  const { error } = await supabase
    .from("comment")
    .update({ comment: updatedComment })
    .eq("created_at", created_at)
    .select();

  if (error) {
    return { status: 500, message: "댓글 수정에 실패했습니다." }
  }

  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 수정되었습니다." };
}
