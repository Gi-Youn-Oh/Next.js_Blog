"use client";

import { useState } from "react";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { FiTrash2 } from "react-icons/fi";
import { Comment, formatDate } from "@/app/service/comment";

interface CommentCardProps {
  comments: Comment[];
  deleteComment: (created_at: string, post_path: string) => void;
  updateComment: (
    created_at: string,
    updatedComment: string,
    post_path: string
  ) => void;
}

export default function CommentCard({
  comments,
  deleteComment,
  updateComment,
}: CommentCardProps) {
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment.created_at);
    setEditedText(comment.comment);
  };

  const handleSaveClick = (comment: Comment) => {
    updateComment(comment.created_at, editedText, comment.post_path);
    setEditingComment(null);
  };

  return (
    <div className="w-full max-h-[500px] overflow-auto p-5 bg-gray-50 rounded-lg shadow-md mb-10">
      <ul className="space-y-4">
        {comments.map((comment: Comment) => (
          <div
            key={comment.created_at}
            className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-row gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {comment.name}
                </span>
                <span className="mt-0.5 text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEditClick(comment)}
                  className="hover:transition hover:scale-110"
                >
                  <HiOutlinePencilSquare />
                </button>
                <button
                  onClick={() =>
                    deleteComment(comment.created_at, comment.post_path)
                  }
                  className="hover:transition hover:scale-110"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            {editingComment === comment.created_at ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg w-full"
                />
                <div className="flex self-end gap-1">
                  <button
                    onClick={() => handleSaveClick(comment)}
                    className="text-xs px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-blue-500"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingComment(null)}
                    className="min-w-300 text-xs px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-red-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <li className="text-gray-700 break-words">{comment.comment}</li>
            )}
          </div>
        ))}
      </ul>
    </div>
  );
}
