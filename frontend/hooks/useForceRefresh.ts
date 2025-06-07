import { useDispatch } from 'react-redux';
import { fetchUserData } from '@/redux/slices/userSlice';

export const useForceRefresh = () => {
  const dispatch = useDispatch();

  const forceRefreshUserData = async (clerkId: string) => {
    try {
      await dispatch(fetchUserData({ clerkId, forceRefresh: true })).unwrap();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return { forceRefreshUserData };
};