import { supabase } from "@/utils/superbase";
import CommentCard from "./CommentCard";
import {Comment, PurifyComment} from "@/app/service/comment";
import { deleteComment, updateComment } from "@/app/actions";
import {getServerSession} from "next-auth";
import {authOptions} from "@/utils/auth";

type Prop = {
  slug: string;
};

export default async function CommentList({ slug }: Prop) {
  const [commentsResponse, session] = await Promise.all([
    supabase.from("comment").select("*").eq("post_path", slug).order("created_at", { ascending: false }),
    getServerSession(authOptions),
  ]);

  const { data: comments, error } = commentsResponse;
  const purifyComments = comments?.map(({ token_id, ...comment }: Comment) => ({
    ...comment,
    isEditable: session?.user?.id === token_id || session?.user?.id === process.env.ADMIN_ACCOUNT,
  }));

  if (error) {
    return <div>댓글을 불러오는 데 실패했습니다.</div>;
  }

  return (
    <div>
      {comments.length === 0 ? (
        <div className="m-5"></div>
      ) : (
          <CommentCard comments={purifyComments as PurifyComment[]} deleteComment={deleteComment} updateComment={updateComment}/>
      )}
    </div>
  );
}
