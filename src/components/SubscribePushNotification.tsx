"use client";

import { useState, useEffect } from "react";
import { sendSingleNotification, subscribeUser, unsubscribeUser } from "@/app/actions";
import { useSession } from "next-auth/react";
import useAuth from "@/hooks/useAuth";

type NotificationPermission = "default" | "denied" | "granted";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SubscribePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const clientSession = useSession();
  const userId = clientSession?.data?.user?.id || "";
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, handleAuthAction } = useAuth();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
          updateViaCache: "none",
        }
      );
      console.log("서비스 워커 등록 완료", registration);

      const sub = await registration.pushManager.getSubscription();
      console.log("기존 구독 상태:", sub);

      setSubscription(sub);
    } catch (err) {
      console.error("서비스 워커 등록 실패", err);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    if (!("Notification" in window) || !navigator.serviceWorker) {
      alert("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }

    if (permission !== "granted") {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        alert("알림 권한이 거부되었습니다.");
        return;
      }
    }

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    // Convert the PushSubscription to the format expected by web-push
    const subscriptionData = {
      user_id: userId,
      endpoint: sub.endpoint,
      keys: {
        p256dh: btoa(
          String.fromCharCode.apply(
            null,
            Array.from(
              new Uint8Array(sub.getKey("p256dh") || new Uint8Array(0))
            )
          )
        ),
        auth: btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array(sub.getKey("auth") || new Uint8Array(0)))
          )
        ),
      },
    };

    setSubscription(sub);
    await subscribeUser(subscriptionData);

    const formData = new FormData();
    formData.append("title", "Giyoun's Blog 구독완료 👋");
    formData.append("body", "새로운 글이 포스팅 되면 알림을 받을 수 있습니다!");
    await sendSingleNotification(userId, formData);
    
    setIsLoading(false);
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser({ user_id: userId });
    setIsLoading(false);
  }

  if (!isSupported) {
    return null;
  }


  if (!isLoggedIn) {
    return (
      <button
        className="w-full p-2 bg-gray-300 text-gray-500 rounded-lg hover:bg-gray-400"
        onClick={handleAuthAction}
      >
        로그인 후 구독하기
      </button>
    );
  }

  return (
    <div className="flex mt-4">
      {subscription ? (
        <div className="flex flex-col items-center gap-2">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
            type="button"
            onClick={unsubscribeFromPush}
            disabled={isLoading || !isLoggedIn}
          >
            {isLoading ? "잠시만 기다려주세요..." : "🔓 구독 해제하기"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-xl"
            type="button"
            onClick={subscribeToPush}
            disabled={isLoading || !isLoggedIn}
          >
            {isLoading ? "잠시만 기다려주세요..." : "🔔 구독하기"}
          </button>
        </div>
      )}
    </div>
  );
}
