import { Suspense } from "react";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

type Prop = {
  slug: string;
};

export default function Comments({ slug }: Prop) {
  return (
    <div>
      <CommentInput slug={slug} />
      {/*<Suspense fallback={<div>댓글을 불러오는 중입니다.</div>}>*/}
        {/* @ts-expect-error Async Server Component */}
        <CommentList slug={slug} />
      {/*</Suspense>*/}
    </div>
  );
}
