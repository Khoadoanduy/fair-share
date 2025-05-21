import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

// Redux Toolkit's configureStore automatically adds the thunk middleware
// and the Redux DevTools extension when available
export const store = configureStore({
  reducer: {
    user: userReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['user/fetchUserData/rejected', 'user/checkPaymentMethod/rejected'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;