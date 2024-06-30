import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";

type Prop = {
  slug: string;
};

export default function CommentInput({ slug }: Prop) {
  const addComment = async (formData: FormData) => {
    'use server'

    const content = formData.get('content');
    if (!content) {
      console.log("return")
      return;
    }
    const { data, error, status } = await supabase
      .from('comment')
      .insert([
        { created_at: new Date(), name: 'testUser', comment: content, post_path: slug },
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
        <button className="w-full p-2 bg-gray-500 text-white rounded-lg hover:bg-blue-500">댓글 작성</button>
      </form>
    </div>
  )
}
