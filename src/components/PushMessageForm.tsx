"use client";

import { useActionState } from "react";
import { sendNotification } from "@/app/actions";

export default function PushMessageForm() {
  const [state, formAction, isPending] = useActionState(sendNotification, {
    status: 200,
    message: "",
  });

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">📢 관리자 푸시 알림</h2>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input
            type="text"
            name="title"
            placeholder="알림 제목 입력"
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">내용</label>
          <textarea
            name="body"
            placeholder="알림 내용을 입력하세요"
            className="w-full border rounded-lg p-2 h-24 resize-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {isPending ? "전송 중..." : "알림 보내기"}
        </button>
      </form>

      {state?.status === 200 && (
        <p className="mt-3 text-green-600 text-sm">
          ✅ 알림이 성공적으로 전송되었습니다!
        </p>
      )}
      {state?.status === 500 && (
        <p className="mt-3 text-red-600 text-sm">
          ❌ 알림 전송에 실패했습니다.
        </p>
      )}
    </div>
  );
}
