import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";
import PostComment from "./PostComment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

type Prop = {
  slug: string;
};

export default async function CommentInput({ slug }: Prop) {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || null;

  const addComment = async (formData: FormData) => {
    'use server'

    const content = formData.get('content');
    if (!content || !userName ||  (typeof content === 'string' && content.trim().length === 0)) {
      return;
    }
    const { data, error, status } = await supabase
      .from('comment')
      .insert([
        { created_at: new Date(), name: userName, comment: content, post_path: slug },
      ])
      .select();
    if (error) {
      throw new Error('댓글 작성에 실패했습니다');
    }

    if (status === 201) {
      revalidatePath(`/posts/${slug}`);
      return { message: '댓글이 작성되었습니다', data };
    }
  }

  return (
    <div className="m-5">
      <form action={addComment}>
        <textarea className="w-full h-24 p-2 border border-gray-300 rounded-lg" placeholder="댓글을 입력해주세요" name="content" />
        <PostComment />
      </form>
    </div>
  )
}
