"use client";

import { useEffect, useState } from "react";

type NotificationPermission = "default" | "denied" | "granted";

export default function PushNotification() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );

  useEffect(() => {
    // 브라우저 환경에서만 접근
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      console.log("Notification permission:", Notification.permission);
    }
  }, []);

  const handlePush = async () => {
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

    const reg = await navigator.serviceWorker.ready;

    reg.showNotification("✅ 알림 테스트", {
      body: "PWA에서 보낸 푸시 알림입니다.",
      icon: "/images/splash-img.png", // 실제 존재하는 경로!
    });
  };

  return <button onClick={handlePush}>🔔 푸시 알림 테스트</button>;
}
