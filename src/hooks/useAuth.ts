"use client";

import { useSession, signIn, signOut } from "next-auth/react";

// Custom Hook
const useAuth = () => {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      signOut();
    } else {
      signIn();
    }
  };

  return { isLoggedIn, handleAuthAction };
};

export default useAuth;
