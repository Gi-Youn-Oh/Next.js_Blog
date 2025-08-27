"use server";

import webpush from "web-push";

import { checkSession } from "@/utils/session";
import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";

type actionResponse = {
  status: number;
  message?: string;
};

export async function addComment(
  formData: FormData,
  userName: string,
  userId: string,
  slug: string
): Promise<actionResponse> {
  const sessionResponse = await checkSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  const content = formData.get("content");
  if (
    !content ||
    (typeof content === "string" && content.trim().length === 0)
  ) {
    return { status: 400, message: "댓글을 입력해주세요" };
  }

  const { data, error, status } = await supabase
    .from("comment")
    .insert([
      {
        created_at: new Date(),
        name: userName,
        comment: content,
        token_id: userId,
        post_path: slug,
      },
    ])
    .select();

  if (error) {
    throw new Error("댓글 작성에 실패했습니다");
  }

  if (status === 201) {
    revalidatePath(`/posts/${slug}`);
  }
  return { status: 201, message: "댓글이 작성되었습니다" };
}

export async function updateComment(
  created_at: string,
  updatedComment: string,
  post_path: string
): Promise<actionResponse> {
  const sessionResponse = await checkSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  const { error } = await supabase
    .from("comment")
    .update({ comment: updatedComment })
    .eq("created_at", created_at)
    .select();

  if (error) {
    return { status: 500, message: "댓글 수정에 실패했습니다." };
  }

  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 수정되었습니다." };
}

export async function deleteComment(
  created_at: string,
  post_path: string
): Promise<actionResponse> {
  const sessionResponse = await checkSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  const { error } = await supabase
    .from("comment")
    .delete()
    .match({ created_at });

  if (error) {
    return { status: 500, message: "댓글 삭제에 실패했습니다." };
  }

  revalidatePath(`/api/posts/${post_path}`);
  return { status: 200, message: "댓글이 삭제되었습니다." };
}

webpush.setVapidDetails(
  "mailto:dhrldbs2679@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

let subscription: PushSubscriptionJSON | null = null;

export async function subscribeUser(subscriptionData: {
  user_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const { data, status, error } = await supabase.from("push_subscriptions").insert({
    user_id: subscriptionData.user_id,
    endpoint: subscriptionData.endpoint,
    p256dh: subscriptionData.keys.p256dh,
    auth: subscriptionData.keys.auth,
  });

  if (error){
    return {status: 500, message: "Push notification subscription failed", error};
  }
  return {status: 200, message: "Push notification subscription successful", data};
}

export async function unsubscribeUser({ user_id }: { user_id: string }) {
  subscription = null;
  // In a production environment, you would want to remove the subscription from the database
  // For example: await db.subscriptions.delete({ where: { ... } })
  const { status, error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user_id);

  if (error){
    return {status: 500, message: "Push notification subscription failed", error};
  }
  return {status: 200, message: "Push notification subscription successful"};
}

export async function sendNotification(prevState: any, formData: FormData) {
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  try {
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) throw error;

    await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body, icon: "/images/splash-img.png" })
        ).catch((err) => {
          console.error("Push failed:", err);
        })
      )
    );

    return { status: "success", message: "Notification sent!" };
  } catch (err) {
    console.error("Notification error:", err);
    return { status: "error", message: "Failed to send notification" };
  }
}
