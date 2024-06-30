import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

type Prop = {
  slug: string;
};

export default function Comments({slug}: Prop) {
  
  return <div>
    <CommentInput slug={slug}/>
    <CommentList slug={slug}/>
  </div>
}