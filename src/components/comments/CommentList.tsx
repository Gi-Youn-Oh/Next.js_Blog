import { supabase } from "@/utils/superbase";
import CommentCard from "./CommentCard";
import { Comment } from "@/app/service/comment";
import { deleteComment, updateComment } from "@/app/actions";

type Prop = {
  slug: string;
};

export default async function CommentList({ slug }: Prop) {
  const {
    data: comments,
    error,
    status,
  } = await supabase.from("comment").select("*").eq("post_path", slug).order("created_at", { ascending: false }); // 시간순 정렬;

  if (error) {
    return <div>댓글을 불러오는 데 실패했습니다.</div>;
  }

  return (
    <div>
      {comments.length === 0 ? (
        <div className="m-5"></div>
      ) : (
          <CommentCard comments={comments as Comment[]} deleteComment={deleteComment} updateComment={updateComment}/>
      )}
    </div>
  );
}
