import React, { createContext, useContext, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useAppDispatch } from "../redux/hooks";
import {
  setSignedIn,
  setUserInfo,
  initializeUserState,
  fetchUserData,
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
      // First fetch MongoDB user data using Clerk ID
      dispatch(fetchUserData(user.id))
        .unwrap()
        .then((mongoUser) => {
          // Once we have MongoDB data, set complete user info
          dispatch(
            setUserInfo({
              id: mongoUser._id || mongoUser.id, // MongoDB ID
              clerkId: user.id, // Clerk ID
              email: user.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || undefined,
              username: user.username || undefined,
            })
          );
        })
        .catch((error) => {
          console.error("Failed to fetch MongoDB user data:", error);
        });
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
