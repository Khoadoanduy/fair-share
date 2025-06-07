import axios from 'axios';
import CustomButton from './CustomButton';
import { useState } from 'react';
import { StyleSheet } from 'react-native';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

type DeclineButtonProps = {
  userId: string;
  groupId: string;
  disabled?: boolean;
  onResponse?: () => void;
};

const DeclineInvitationButton = ({ userId, groupId, disabled, onResponse }: DeclineButtonProps) => {
  const [declined, setDeclined] = useState(false);
  const handleDecline = async () => {
    try {
      await axios.delete(`${API_URL}/api/invite/${groupId}/${userId}`);
      setDeclined(true);
      onResponse?.();
      console.log('Decline and remove invitation successfully');
    } catch (error) {
      console.log('Error declining invitation: ', error);
    }
  };

  return <CustomButton 
            text={declined ? "Declined" : "Decline"} 
            onPress={handleDecline}
            disabled={disabled} 
            style={[declined ? styles.buttonDeclined : styles.buttonActive, styles.button]}
            textStyle={declined ? styles.textDeclined : styles.text}/>;
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '48%',
  },
  buttonActive: {
    backgroundColor: '#4A3DE31A', 
  },
  buttonDeclined: {
    backgroundColor: 'red', 
  },
  text: {
    color: '#4A3DE3'
  },
  textDeclined: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeclineInvitationButton;
