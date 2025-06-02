## Structure
- `store.ts` - The main Redux store configuration
- `hooks.ts` - Custom hooks for accessing the Redux store
- `slices/` - Directory containing Redux Toolkit slices
  - `userSlice.ts` - Manages user authentication and payment status

## User State
- `isSignedIn` - Whether the user is currently authenticated
- `hasPayment` - Whether the user has added a payment method
- `userId` - The user's Clerk ID
- `email` - The user's email address
- `name` - The user's full name
- `stripeCustomerId` - The user's Stripe customer ID
- `onboardingComplete` - Whether the user has completed the onboarding process
- `needsUserOnboarding` - Whether the user needs to complete the onboarding process
- `loading` - Whether any async operations are in progress
- `error` - Any error messages from async operations
### In Components

```tsx
import { useUserState } from '@/hooks/useUserState';

function MyComponent() {
  const { isSignedIn, hasPayment } = useUserState();
  
  return (
    <View>
      {isSignedIn ? (
        <Text>You are signed in!</Text>
      ) : (
        <Text>Please sign in</Text>
      )}
      
      {hasPayment ? (
        <Text>Payment method added</Text>
      ) : (
        <Button title="Add Payment Method" onPress={handleAddPayment} />
      )}
    </View>
  );
}
```

### Dispatching Actions

```tsx
import { useAppDispatch } from '@/redux/hooks';
import { setHasPayment } from '@/redux/slices/userSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  
  const handlePaymentSuccess = () => {
    dispatch(setHasPayment(true));
  };
  
  return (
    <Button title="Mark Payment Added" onPress={handlePaymentSuccess} />
  );
}
```

### Async Actions

```tsx
import { useAppDispatch } from '@/redux/hooks';
import { fetchUserData, checkPaymentMethod } from '@/redux/slices/userSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { userId } = useUserState();
  
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserData(userId));
      dispatch(checkPaymentMethod(userId));
    }
  }, [userId, dispatch]);
  
  return <View>...</View>;
}
```

## Integration with Clerk Authentication
The Redux state is synchronized with Clerk authentication in the `AuthContext.tsx` file. When a user signs in or out with Clerk, the Redux state is updated accordingly.