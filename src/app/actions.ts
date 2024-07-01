import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function deleteComment(created_at: string, post_path: string) {
  "use server";

  const { error, status } = await supabase
    .from("comment")
    .delete()
    .match({ created_at });

  if (error) {
    return NextResponse.json(
      { message: "댓글 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 삭제되었습니다." };
}

export async function updateComment(
  created_at: string,
  updatedComment: string,
  post_path: string
) {
  'use server'
  const { data, error } = await supabase
    .from("comment")
    .update({comment: updatedComment} )
    .eq("created_at", created_at)
    .select();

  if (error) {
    return NextResponse.json(
      { message: "댓글 수정에 실패했습니다." },
      { status: 500 }
    );
  }
  console.log(data,'??')
  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 수정되었습니다." };
}
