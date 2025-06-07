import axios from 'axios';
import CustomButton from './CustomButton';
import { useState } from 'react';
import { StyleSheet } from 'react-native';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

type AcceptButtonProps = {
  userId: string;
  groupId: string;
  disabled?: boolean;
  onResponse?: () => void;
};

const AcceptInvitationButton = ({ userId, groupId, disabled, onResponse }: AcceptButtonProps) => {
  const [accepted, setAccepted] = useState(false);
  const handleAccept = async () => {
    try {
      await axios.put(`${API_URL}/api/invite/${groupId}/${userId}`);
      await axios.post(`${API_URL}/api/groupMember/${groupId}/${userId}`, {userRole: "member"});
      setAccepted(true);
      onResponse?.();
      console.log('Accept invitation successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  return <CustomButton 
            text={accepted ? "Accepted" : "Accept"} 
            onPress={handleAccept}
            disabled={disabled} 
            style={[accepted ? styles.buttonAccepted : styles.buttonActive, styles.button]}
            textStyle={accepted ? styles.textAccepted : styles.buttonText}/>;
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
    backgroundColor: 'green', 
  },
  textAccepted: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AcceptInvitationButton;
