import { createSlice, createAsyncThunk, PayloadAction, createAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL
// Define types for our state
interface UserState {
  isSignedIn: boolean | false;
  hasPayment: boolean;
  userId: string | null;
  clerkId: string | null; // Add this line for Clerk ID
  email: string | null;
  name: string | null;
  username: string | null;
  stripeCustomerId: string | null;
  onboardingComplete: boolean;
  needsUserOnboarding: boolean;
  loading: boolean;
  error: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  firstName?: string | null; // Optional field for first name
  lastName?: string | null; // Optional field for last name
}

// Initial state
const initialState: UserState = {
  isSignedIn: false,
  hasPayment: false,
  userId: null,
  clerkId: null, // Add this line
  email: null,
  name: null,
  username: null,
  stripeCustomerId: null,
  onboardingComplete: false,
  needsUserOnboarding: true, // Set default to true
  loading: false,
  error: null,
  dateOfBirth: null,
  phoneNumber: null,
};

// Async thunk for fetching user data
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (clerkId: string, { rejectWithValue }) => {
    if (!clerkId) {
      return rejectWithValue('No clerk ID provided');
    }
    
      const response = await axios.get(`${API_URL}/api/user/`, {
        params: {
          clerkID: clerkId
        }
      });
      
      
      const userData = response.data;
      return {
        ...userData,
        id: userData.id, // Ensure MongoDB _id is included as id
        hasPaymentMethod: Boolean(userData.customerId)
      };
  }
);

export const checkPaymentMethod = createAsyncThunk(
  'user/checkPaymentMethod',
  async (clerkId: string, { rejectWithValue }) => {
    if (!clerkId) {
      return rejectWithValue('No clerk ID provided');
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/user/`, {
        params: {
          clerkID: clerkId
        }
      });
      return response.data
    } catch (error: any) {
      console.error('Error checking payment method:', error);
      return false;
    }
  }
);

export const initializeUserState = createAsyncThunk(
  'user/initializeState',
  async (userId: string) => {
    const onboardingComplete = await AsyncStorage.getItem("onboardingComplete");
    const needsUserOnboarding = await AsyncStorage.getItem("needsUserOnboarding");
    
    return {
      onboardingComplete: onboardingComplete === "true",
      needsUserOnboarding: needsUserOnboarding === null ? true : needsUserOnboarding === "true"
    };
  }
);

export const setOnboardingComplete = createAction<boolean>('user/setOnboardingComplete');
export const setUserOnboardingComplete = createAction<boolean>('user/setUserOnboardingComplete');

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.isSignedIn = action.payload;
    },
    setUserInfo: (state, action: PayloadAction<{
      clerkId: string;
      email: string;
      name?: string;
      username?: string;
      id: string;      // This is the MongoDB _id
      firstName?: string;
      lastName?: string;
    }>) => {
      state.userId = action.payload.id;    
      state.clerkId = action.payload.clerkId;       // Store MongoDB ID
      state.email = action.payload.email;
      state.name = action.payload.name || null;
      state.username = action.payload.username || null;
    },
    setUserDetails: (state, action: PayloadAction<{
      dateOfBirth?: string;
      phoneNumber?: string;
    }>) => {
      if (action.payload.dateOfBirth) {
        state.dateOfBirth = action.payload.dateOfBirth;
      }
      if (action.payload.phoneNumber) {
        state.phoneNumber = action.payload.phoneNumber;
      }
    },
    setStripeCustomerId: (state, action: PayloadAction<string>) => {
      state.stripeCustomerId = action.payload;
    },
    setHasPayment: (state, action: PayloadAction<boolean>) => {
      state.hasPayment = action.payload;
    },
    setOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.onboardingComplete = action.payload;
      // Only update needsUserOnboarding if completing onboarding
      if (action.payload) {
        state.needsUserOnboarding = false;
      }
    },
    setNeedsUserOnboarding: (state, action: PayloadAction<boolean>) => {
      state.needsUserOnboarding = action.payload;
    },
    resetUser: (state) => {
      // Reset everything except onboardingComplete
      const currentOnboardingComplete = state.onboardingComplete;
      
      // Reset to initial state
      const newState = { ...initialState };
      
      // Preserve onboarding complete
      newState.onboardingComplete = currentOnboardingComplete;
      
      return newState;
    },
    setUserOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.needsUserOnboarding = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUserData
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.email = action.payload.email || state.email;
          state.name = action.payload.firstName 
            ? `${action.payload.firstName} ${action.payload.lastName || ''}`
            : action.payload.name || state.name;
          state.userId = action.payload._id || action.payload.id || state.userId; // Handle both _id and id
          state.clerkId = action.payload.clerkId || state.clerkId; // Store Clerk ID
          state.stripeCustomerId = action.payload.customerId || state.stripeCustomerId;
          state.hasPayment = Boolean(action.payload.customerId);
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch user data';
      })
      // Handle checkPaymentMethod
      .addCase(checkPaymentMethod.pending, (state) => {
        // Don't set loading to true for this action to avoid UI flicker
        state.error = null;
      })
      .addCase(checkPaymentMethod.fulfilled, (state, action) => {
        // Update hasPayment state based on the response
        state.hasPayment = !!action.payload;
        if(action.payload){
          state.stripeCustomerId = action.payload.customerId || state.stripeCustomerId;
        }
      })
      .addCase(checkPaymentMethod.rejected, (state, action) => {
        // If checking payment method fails, assume no payment method
        state.hasPayment = false;
        state.error = null; // Don't show error to user for this action
      })
      .addCase(initializeUserState.fulfilled, (state, action) => {
        state.onboardingComplete = action.payload.onboardingComplete;
        state.needsUserOnboarding = action.payload.needsUserOnboarding;
      });
  },
});

// Export actions
export const {
  setSignedIn,
  setUserInfo,
  setUserDetails,
  setStripeCustomerId,
  setHasPayment,
  setNeedsUserOnboarding,
  resetUser,
} = userSlice.actions;

// Export reducer
export default userSlice.reducer;