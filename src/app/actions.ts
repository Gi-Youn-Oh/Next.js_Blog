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
    return NextResponse.json({ message: "댓글 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 삭제되었습니다." };
}
