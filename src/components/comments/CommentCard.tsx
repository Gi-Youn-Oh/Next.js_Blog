"use client";

import { useState } from "react";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { FiTrash2 } from "react-icons/fi";
import { Comment, formatDate } from "@/app/service/comment";
import { useSession } from "next-auth/react";
import { useOptimistic } from 'react';

interface CommentCardProps {
  comments: Comment[];
  updateComment: (
    created_at: string,
    updatedComment: string,
    post_path: string
  ) => void;
  deleteComment: (created_at: string, post_path: string) => void;
}

export default function CommentCard({
  comments,
  updateComment,
  deleteComment
}: CommentCardProps) {
  const clientSession = useSession();
  const userName = clientSession?.data?.user?.name || null;
  const adminAccount = userName === 'Gi Youn Oh';

  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  const [optimisticComments, applyOptimisticUpdate] = useOptimistic<Comment[], { created_at: string, updatedComment?: string }>(
    comments,
    (state, { created_at, updatedComment }) => {
      if (updatedComment !== undefined) {
        return state.map(comment =>
          comment.created_at === created_at ? { ...comment, comment: updatedComment } : comment
        );
      } else {
        return state.filter(c => c.created_at !== created_at);
      }
    }
  );

  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment.created_at);
    setEditedText(comment.comment);
  };

  const handleSaveClick = (comment: Comment) => {
    applyOptimisticUpdate({ created_at: comment.created_at, updatedComment: editedText });
    updateComment(comment.created_at, editedText, comment.post_path);
    setEditingComment(null);
  };

  const handleDeleteClick = async (comment: Comment) => {
    applyOptimisticUpdate({ created_at: comment.created_at });
    await deleteComment(comment.created_at, comment.post_path);
  };

  return (
    <div className="w-full max-h-[500px] overflow-auto p-5 bg-gray-50 rounded-lg shadow-md mb-10">
      <ul className="space-y-4">
        {optimisticComments.map((comment: Comment) => (
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
              {(userName === comment.name || adminAccount) && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditClick(comment)}
                    className="hover:transition hover:scale-110"
                  >
                    <HiOutlinePencilSquare />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(comment)}
                    className="hover:transition hover:scale-110"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              )}
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
              <li className="text-gray-700 break-words whitespace-pre-wrap">{comment.comment}</li>
            )}
          </div>
        ))}
      </ul>
    </div>
  );
}
