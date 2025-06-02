import { StyleSheet, Text, View, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-expo';

export default function AllInvitations() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useUser();
  const clerkId = user?.id;
  const [invitations, setInvitations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [responseStatus, setResponseStatus] = useState({});

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/user/`, {
          params: { clerkID: clerkId },
        });
        setUserId(response.data.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (clerkId) {
      fetchUserId();
    }
  }, [clerkId]);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/user/invitation/${userId}`);
        setInvitations(response.data || []);
      } catch (error) {
        console.log('Error fetching invitations:', error);
      }
    };

    if (userId) {
      fetchInvitations();
    }
  }, [userId]);

  const handleAccept = async (groupId) => {
    try {
      await axios.put(`${API_URL}/api/invite/${groupId}/${userId}`);
      setResponseStatus((prev) => ({ ...prev, [groupId]: 'accepted' }));
      console.log('Accept invitation successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDecline = async (groupId) => {
    try {
      await axios.delete(`${API_URL}/api/invite/${groupId}/${userId}`);
      setResponseStatus((prev) => ({ ...prev, [groupId]: 'declined' }));
      console.log('Decline and remove invitation successfully');
    } catch (error) {
      console.log('Error declining invitation: ', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>All Group Invitations</Text>

      {invitations.length > 0 ? (
        invitations.map((invite, index) => {
          const groupId = invite.group.id;
          const status = responseStatus[groupId];
          const isDisabled = status === 'accepted' || status === 'declined';

          return (
            <View key={index} style={styles.card}>
              <Text style={styles.text}>{invite.group?.groupName}</Text>
              <View style={styles.buttonContainer}>
              <CustomButton
                text="Accept"
                onPress={() => handleAccept(groupId)}
                disabled={isDisabled}
                style={[
                  styles.button,
                  isDisabled && status === 'accepted' && styles.accepted,
                ]}
              />
              <CustomButton
                text="Decline"
                onPress={() => handleDecline(groupId)}
                disabled={isDisabled}
                style={[
                  styles.button,
                  isDisabled && status === 'declined' && styles.declined,
                ]}
              />
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No invitations found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'space-between'
  },
  textContainer: {
    flex: 2,
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  accepted: {
    backgroundColor: '#4caf50',
  },
  declined: {
    backgroundColor: '#f44336',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: 'gray',
  },
});
