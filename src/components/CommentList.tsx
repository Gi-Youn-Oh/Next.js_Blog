import { supabase } from "@/utils/superbase";

type Prop = {
  slug: string;
}


export default async function CommentList({ slug }: Prop) {
  // 날짜 변환 함수
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    return date.toLocaleString('ko-KR', options);
  }

  const { data: comments, error } = await supabase
    .from('comment')
    .select('*')
    .eq('post_path', slug);

  if (error) {
    return <div>댓글을 불러오는 데 실패했습니다.</div>;
  }

  return (
    <div>
    {comments.length === 0 ? <div className="m-5"></div> :
    <div className="w-full h-1/5 max-h-[500px] overflow-auto p-4 bg-gray-50 rounded-lg shadow-md mb-10">
      <ul className="space-y-4">
        {comments.map((comment: any) => (
          <div key={comment.created_at} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <li className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-900">{comment.name}</span>
              <span className="ml-2 text-xs text-gray-500">{formatDate(comment.created_at)}</span>
            </li>
            <li className="text-gray-700">{comment.comment}</li>
          </div>
        ))}
      </ul>
    </div>}
    </div>
  );
}
