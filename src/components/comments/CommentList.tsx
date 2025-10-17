import { supabase } from "@/utils/superbase";
import CommentCard from "./CommentCard";
import {Comment, formatDate, PurifyComment} from "@/service/comment";
import { deleteComment, updateComment } from "@/app/actions";
import {getServerSession} from "next-auth";
import {authOptions} from "@/utils/auth";
import { getCachedComments, setCachedComments, checkRedisConnection, invalidateCommentCache } from "@/utils/redis";

type Prop = {
  slug: string;
};

export default async function CommentList({ slug }: Prop) {
  // Redis 연결 확인
  const redisConnected = await checkRedisConnection();
  
  let comments: Comment[] = [];
  let error: any = null;
  
  // Redis 캐시에서 먼저 조회 시도
  if (redisConnected) {
    try {
      const cachedComments = await getCachedComments(slug);
      if (cachedComments && Array.isArray(cachedComments) && cachedComments.length > 0) {
        // 캐시된 데이터가 유효한 댓글 배열인지 확인
        const isValidCache = cachedComments.every(comment => 
          comment && 
          typeof comment === 'object' && 
          comment.created_at && 
          comment.comment && 
          comment.name
        );
        
        if (isValidCache) {
          comments = cachedComments;
          console.log(`Redis 캐시에서 댓글 조회: ${slug} (${comments.length}개)`);
        } else {
          console.warn('Redis 캐시 데이터가 유효하지 않습니다. Supabase에서 재조회합니다.');
          // 잘못된 캐시 삭제
          await invalidateCommentCache(slug);
        }
      }
    } catch (cacheError) {
      console.error('Redis 캐시 조회 중 오류:', cacheError);
      // 캐시 오류 시 해당 캐시 삭제
      await invalidateCommentCache(slug);
    }
  }
  
  // 캐시에 없으면 Supabase에서 조회
  if (comments.length === 0) {
    const commentsResponse = await supabase
      .from("comment")
      .select("*")
      .eq("post_path", slug)
      .order("created_at", { ascending: false });
    
    comments = commentsResponse.data || [];
    error = commentsResponse.error;
    
    // Redis에 캐시 저장
    if (redisConnected && comments.length > 0 && !error) {
      await setCachedComments(slug, comments);
      console.log(`Redis에 댓글 캐시 저장: ${slug}`);
    }
  }
  
  // 세션 정보 조회
  const session = await getServerSession(authOptions);
  
  const purifyComments = comments?.map(({ token_id, ...comment }: Comment) => ({
    ...comment,
    created_at: formatDate(comment.created_at),
    original_created_at: comment.created_at,
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
