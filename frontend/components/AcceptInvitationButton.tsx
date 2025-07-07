import axios from 'axios';
import CustomButton from './CustomButton';
import { useState } from 'react';
import { StyleSheet, Modal, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserState } from "@/hooks/useUserState";
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type AcceptButtonProps = {
  userId: string;
  groupId: string;
  disabled?: boolean;
  hasPayment: boolean;
  username?: string;
  onResponse?: () => void;
};

const AcceptInvitationButton = ({ userId, groupId, disabled, hasPayment, username, onResponse }: AcceptButtonProps) => {
  const [accepted, setAccepted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);  // State for showing the payment modal
  const router = useRouter();

  // Handle Accept Invitation
  const handleAccept = async () => {
    if (!hasPayment) {
      setShowPaymentModal(true);  // Show the payment modal if the user has no payment method
    } else {
      try {
        await axios.put(`${API_URL}/api/invite/${groupId}/${userId}`);
        await axios.post(`${API_URL}/api/groupMember/${groupId}/${userId}`, { userRole: "member" });
        const response = await axios.get(`${API_URL}/api/group/leader/${groupId}`);
      await axios.post(
        `${API_URL}/api/notifications/send`,
        {
          mongoIds: [response.data.id],
          title: "Invitation Accepted",
          body: username? `${username} has accepted your invitation to join the group.` : "The user has been accepted to the group.",
          data: {
            type: "group_accepted",
            groupId,
          },
        }
      );
      setAccepted(true);
        onResponse?.();
        console.log('Accept invitation successfully');
      } catch (error) {
        console.error('Error accepting invitation:', error);
      }
    }
  };

  const handleLinkPayment = () => {
    setShowPaymentModal(false);  // Close the payment modal
    router.push('/(collectpayment)/CollectPayment');  // Navigate to the payment screen
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);  // Close the payment modal without any action
  };

  return (
    <>
      {/* Accept Invitation Button */}
      <CustomButton 
        text={accepted ? "Accepted" : "Accept"} 
        rightIcon={ accepted ? <Ionicons name="checkmark" size={18} color="#94A3B8" /> : undefined }
        onPress={handleAccept}
        disabled={disabled} 
        style={[accepted ? styles.buttonAccepted : styles.buttonActive, styles.button]}
        textStyle={accepted ? styles.textAccepted : styles.buttonText}
      />

      {/* Payment Prompt Modal */}
      <Modal transparent={true} visible={showPaymentModal} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Payment Method Required</Text>
            <Text style={styles.modalMessage}>
              You need to link a payment method before you can accept this invitation.
            </Text>
            <Pressable style={styles.modalButton} onPress={handleLinkPayment}>
              <Text style={styles.buttonText}>Link Payment Method</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={handleClosePaymentModal}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '48%',
  },
  buttonActive: {
    backgroundColor: '#4A3DE3',
  },
  buttonAccepted: {
    backgroundColor: '#E2E8F0',
  },
  textAccepted: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4A3DE3",
    borderRadius: 5,
    marginVertical: 5,
  },
});

export default AcceptInvitationButton;
