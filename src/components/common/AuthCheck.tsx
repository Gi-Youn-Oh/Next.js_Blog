"use client";

import useAuth from "@/hooks/useAuth";

export default function AuthCheck() {
  const { isLoggedIn, handleAuthAction } = useAuth();
  const authText = isLoggedIn ? "Logout" : "Login";

  return (
    <button onClick={handleAuthAction}>
      <span className={!isLoggedIn ? "text-blue-400" : "text-red-400"}>
        {authText}
      </span>
    </button>
  );
}
