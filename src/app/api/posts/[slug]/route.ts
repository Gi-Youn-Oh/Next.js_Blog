//
import { NextRequest } from "next/server";
import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";

type Props = {
  params: {
    slug: string;
  };
};

export async function DELETE(request: NextRequest, { params }: Props) {
  const { created_at } = await request.json();

  const { error, status } = await supabase
    .from("comment")
    .delete()
    .match({ created_at });

  if (error) {
    return new Response(
      JSON.stringify({ message: "댓글 삭제에 실패했습니다." }),
      { status: 500 }
    );
  }

  revalidatePath(`/api/posts/${params.slug}`);

  return new Response(JSON.stringify({ message: "댓글이 삭제되었습니다." }), {
    status: 200,
  });
}
