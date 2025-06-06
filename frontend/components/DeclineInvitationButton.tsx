import axios from 'axios';
import CustomButton from './CustomButton';
import { useState } from 'react';
import { StyleSheet } from 'react-native';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

type DeclineButtonProps = {
  userId: string;
  groupId: string;
};

const DeclineInvitationButton = ({ userId, groupId }: DeclineButtonProps) => {
  const [declined, setDeclined] = useState(false);
  const handleDecline = async (groupId) => {
    try {
      await axios.delete(`${API_URL}/api/invite/${groupId}/${userId}`);
      setDeclined(true);
      console.log('Decline and remove invitation successfully');
    } catch (error) {
      console.log('Error declining invitation: ', error);
    }
  };

  return <CustomButton 
            text={declined? "Declined" : "Decline"} 
            onPress={handleDecline} 
            style={[declined ? styles.buttonDeclined : styles.buttonActive, styles.button]}
            textStyle = {declined ? styles.textDeclined : null}/>;
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#4A3DE3', 
  },
  buttonDeclined: {
    backgroundColor: 'red', 
  },
  textDeclined: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeclineInvitationButton;
