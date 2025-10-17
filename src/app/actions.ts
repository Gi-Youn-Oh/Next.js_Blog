"use server";

import webpush from "web-push";

import { checkSession } from "@/utils/session";
import { supabase } from "@/utils/superbase";
import { revalidatePath } from "next/cache";
import { checkRateLimit, invalidateCommentCache, updateCommentStats, checkRedisConnection, checkBothRateLimits } from "@/utils/redis";

type actionResponse = {
  status: number;
  message?: string;
};

export async function addComment(
  formData: FormData,
  userName: string,
  userId: string,
  slug: string,
  clientIP?: string
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

  // Redis 연결 확인
  const redisConnected = await checkRedisConnection();
  // Rate Limiting 체크 (Redis가 연결된 경우에만)
  if (redisConnected) {
    // IP가 제공된 경우 사용자 ID와 IP 모두 체크
    if (clientIP) {
      const rateLimits = await checkBothRateLimits(
        userId, 
        clientIP, 
        slug, 
        5, // 사용자별 5분에 5개
        10, // IP별 5분에 10개
        300
      );
      
      if (!rateLimits.allowed) {
        const resetTime = rateLimits.reason === 'user_limit' 
          ? new Date(rateLimits.userLimit.resetTime).toLocaleString('ko-KR')
          : new Date(rateLimits.ipLimit.resetTime).toLocaleString('ko-KR');
        
        const message = rateLimits.reason === 'user_limit'
          ? `계정당 댓글 작성 제한에 도달했습니다. ${resetTime}에 다시 시도해주세요.`
          : `IP별 댓글 작성 제한에 도달했습니다. ${resetTime}에 다시 시도해주세요.`;
          return { 
            status: 429, 
            message 
          };
        }
      } else {
        // IP가 없는 경우 기존 사용자 ID만 체크
        const rateLimit = await checkRateLimit(userId, slug, 5, 300);
        console.log(rateLimit,'warning limit')
      
      if (!rateLimit.allowed) {
        const resetTime = new Date(rateLimit.resetTime).toLocaleString('ko-KR');
        return { 
          status: 429, 
          message: `댓글 작성이 너무 빈번합니다. ${resetTime}에 다시 시도해주세요.` 
        };
      }
    }
  }

  try {
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
      // Redis 캐시 무효화 및 통계 업데이트
      if (redisConnected) {
        await invalidateCommentCache(slug);
        await updateCommentStats(slug, 1);
      }
      
      revalidatePath(`/posts/${slug}`);
    }
    
    return { status: 201, message: "댓글이 작성되었습니다" };
  } catch (error) {
    console.error('댓글 작성 중 오류:', error);
    return { status: 500, message: "댓글 작성에 실패했습니다" };
  }
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

  try {
    const { error } = await supabase
      .from("comment")
      .update({ comment: updatedComment })
      .eq("created_at", created_at)
      .select();

    if (error) {
      return { status: 500, message: "댓글 수정에 실패했습니다." };
    }

    // Redis 캐시 무효화
    const redisConnected = await checkRedisConnection();
    if (redisConnected) {
      await invalidateCommentCache(post_path);
    }

    revalidatePath(`/posts/${post_path}`);
    return { status: 200, message: "댓글이 수정되었습니다." };
  } catch (error) {
    console.error('댓글 수정 중 오류:', error);
    return { status: 500, message: "댓글 수정에 실패했습니다." };
  }
}

export async function deleteComment(
  created_at: string,
  post_path: string
): Promise<actionResponse> {
  const sessionResponse = await checkSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  try {
    const { error } = await supabase
      .from("comment")
      .delete()
      .match({ created_at });

    if (error) {
      return { status: 500, message: "댓글 삭제에 실패했습니다." };
    }

    // Redis 캐시 무효화 및 통계 업데이트
    const redisConnected = await checkRedisConnection();
    if (redisConnected) {
      await invalidateCommentCache(post_path);
      await updateCommentStats(post_path, -1);
    }

    revalidatePath(`/posts/${post_path}`);
    return { status: 200, message: "댓글이 삭제되었습니다." };
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    return { status: 500, message: "댓글 삭제에 실패했습니다." };
  }
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
  const { data, status, error } = await supabase
    .from("push_subscriptions")
    .insert({
      user_id: subscriptionData.user_id,
      endpoint: subscriptionData.endpoint,
      p256dh: subscriptionData.keys.p256dh,
      auth: subscriptionData.keys.auth,
    });

  if (error) {
    return {
      status: 500,
      message: "Push notification subscription failed",
      error,
    };
  }
  return {
    status: 200,
    message: "Push notification subscription successful",
    data,
  };
}

export async function unsubscribeUser({ user_id }: { user_id: string }) {
  subscription = null;
  // In a production environment, you would want to remove the subscription from the database
  // For example: await db.subscriptions.delete({ where: { ... } })
  const { status, error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user_id);

  if (error) {
    return {
      status: 500,
      message: "Push notification subscription failed",
      error,
    };
  }
  return { status: 200, message: "Push notification subscription successful" };
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
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title, body, icon: "/images/splash-img.png" })
          )
          .catch((err) => {
            console.error("Push failed:", err);
          })
      )
    );

    return { status: 200, message: "Notification sent!" };
  } catch (err) {
    console.error("Notification error:", err);
    return { status: 500, message: "Failed to send notification" };
  }
}

export async function sendSingleNotification(
  userId: string,
  endpoint: string,
  formData: FormData
) {
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  try {
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("endpoint", endpoint)
      .single();

    if (error) throw error;

    await webpush.sendNotification(
      {
        endpoint: subscriptions.endpoint,
        keys: { p256dh: subscriptions.p256dh, auth: subscriptions.auth },
      },
      JSON.stringify({ title, body, icon: "/images/splash-img.png" })
    );

    return { status: 200, message: "Notification sent!" };
  } catch (err) {
    console.error("Notification error:", err);
    return { status: 500, message: "Failed to send notification" };
  }
}

export async function checkSubscription(userId: string, endpoint: string) {
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  const onlyUserIds = subscriptions?.map((sub) => ({ user_id: sub.user_id }));
  if (error) {
    return { status: 500, message: "Subscription checked failed", error };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { status: 404, message: "Subscription not found", data: [] };
  }

  return { status: 200, message: "Subscription exists", data: onlyUserIds };
}
