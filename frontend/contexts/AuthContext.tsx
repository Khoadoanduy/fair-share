import React, { createContext, useContext, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useAppDispatch } from "../redux/hooks";
import {
  setSignedIn,
  setUserInfo,
  initializeUserState,
} from "../redux/slices/userSlice";

type AuthContextType = {
  isSignedIn: boolean;
  isLoaded: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isLoaded) return;

    dispatch(setSignedIn(isSignedIn || false));

    if (isSignedIn && user) {
      dispatch(
        setUserInfo({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.fullName || undefined,
          username: user.username || undefined, // Add this
        })
      );
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <AuthContext.Provider value={{ isSignedIn: isSignedIn || false, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be inside AuthProvider");
  }
  return ctx;
}
