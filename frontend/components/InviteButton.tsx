import axios from 'axios';
import CustomButton from './CustomButton';
import { useState } from 'react';
import { StyleSheet } from 'react-native';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

type InviteButtonProps = {
  userId: string;
  groupId: string;
};

const InviteButton = ({ userId, groupId }: InviteButtonProps) => {
  const [invited, setInvited] = useState(false);
  const handleInvite = async () => {
    if (invited) return;
    try {
      const response = await axios.post(`${API_URL}/api/groups/${groupId}/invite/${userId}`);
      console.log('Invitation sent:', response.data);
      setInvited(true);
    } catch (error) {
      console.error('Error sending invitation:', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        console.log('User already invited (409)');
        setInvited(true);
      }
    }
  };

  return <CustomButton 
            text={invited? "Invited" : "Invite"} 
            onPress={handleInvite} 
            style={[invited ? styles.buttonInvited : styles.buttonActive, styles.button]}/>;
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
    backgroundColor: '#000000', 
  },
  buttonInvited: {
    backgroundColor: '#A0AEC0', 
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InviteButton;
