import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import CustomButton from './CustomButton';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type FriendRequestButtonProps = {
  senderId: string;
  recipientId: string;
  onRequestSent?: () => void; // Add callback for parent component
  item?: any; // Add item prop for friend status
  actionLoadingIds?: { [key: string]: boolean }; // Add actionLoadingIds prop
  handleSendInvitation?: (id: string) => void; // Add handleSendInvitation prop
};

const FriendRequestButton = ({
  senderId,
  recipientId,
  onRequestSent,
  item,
  actionLoadingIds,
  handleSendInvitation
}: FriendRequestButtonProps) => {
  const [requested, setRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleRequest = async () => {
    if (requested || isLoading) return;

    setIsLoading(true); // Show loading state immediately
    try {
      const response = await axios.post(`${API_URL}/api/friend/invitation`, {
        senderId,
        recipientId
      });
      console.log('Friend request sent:', response.data);
      setRequested(true);

      // Call parent callback to refresh data
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        console.log('Friend request already sent (409)');
        setRequested(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return item?.isFriend ? (
    <View style={styles.invitedButton}>
      <Text style={styles.invitedText}>Friends</Text>
    </View>
  ) : item?.isPending ? (
    <View style={styles.invitedButton}>
      <Text style={styles.invitedText}>Invited</Text>
    </View>
  ) : (
    <TouchableOpacity
      style={styles.inviteButton}
      onPress={() => handleSendInvitation ? handleSendInvitation(item.id) : handleRequest()}
      disabled={actionLoadingIds ? actionLoadingIds[item.id] : isLoading || requested}
    >
      {actionLoadingIds && actionLoadingIds[item.id] ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Ionicons
          name="person-add"
          size={18}
          color="white"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonActive: {
    backgroundColor: '#4A3DE3',
  },
  buttonRequested: {
    backgroundColor: '#E2E8F0',
  },
  textRequested: {
    color: '#9EA2AE',
  },
  invitedButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  invitedText: {
    color: '#9EA2AE',
  },
  inviteButton: {
    backgroundColor: '#4A3DE3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 36,
  },
  inviteText: {
    color: 'white',
  },
});

export default FriendRequestButton;