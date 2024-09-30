"use client";

import useAuth from "@/hooks/useAuth";
import { useFormStatus } from "react-dom";

export default function PostComment() {
  const { isLoggedIn } = useAuth();
  const { pending } = useFormStatus();

  return (
    <div>
      {isLoggedIn && (
        <button className="w-full p-2 bg-gray-500 text-white rounded-lg hover:bg-blue-500 flex justify-center items-center" disabled={pending}>
          {pending ? <div className="spinner"></div> : '댓글 작성'}
        </button>
      )}
    </div>
  );
}
