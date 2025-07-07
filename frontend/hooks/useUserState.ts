import { setStripeCustomerId } from '@/redux/slices/userSlice';
import { useAppSelector } from '../redux/hooks';
import { useMemo } from 'react';

/**
 * Custom hook to access user state from Redux
 * Provides easy access to authentication status, payment status, and other user-related state
 */
export function useUserState() {
  const userState = useAppSelector(state => state.user)
  return {
    // Authentication status
    isSignedIn: userState.isSignedIn,
    userId: userState.userId,
    email: userState.email,
    name: userState.name,
    username: userState.username,
    
    // User details
    dateOfBirth: userState.dateOfBirth,
    phoneNumber: userState.phoneNumber,
    firstName: userState.firstName,
    lastName: userState.lastName,

    
    // Payment status
    hasPayment: userState.hasPayment,
    stripeCustomerId: userState.stripeCustomerId,
    
    // Onboarding status
    onboardingComplete: userState.onboardingComplete,
    needsUserOnboarding: userState.needsUserOnboarding,
    
    // Loading and error states
    loading: userState.loading,
    error: userState.error,
  };
}