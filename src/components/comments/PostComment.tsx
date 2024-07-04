"use client";

import useAuth from "@/hooks/useAuth";
import { useFormStatus } from "react-dom";

export default function PostComment() {
  const { isLoggedIn, handleAuthAction } = useAuth();
  const { pending } = useFormStatus();

  return (
    <div>
      {isLoggedIn ? (
        <button className="w-full p-2 bg-gray-500 text-white rounded-lg hover:bg-blue-500 flex justify-center items-center">
          {pending ? <div className="spinner"></div> : '댓글 작성'}
        </button>
      ) : (
        <button
          className="w-full p-2 bg-gray-300 text-gray-500 rounded-lg hover:bg-gray-400"
          onClick={handleAuthAction}
        >
          로그인 후 댓글 작성 하러가기
        </button>
      )}
    </div>
  );
}
