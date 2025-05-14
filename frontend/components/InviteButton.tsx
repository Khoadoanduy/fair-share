import axios from 'axios';
import CustomButton from './CustomButton';

const API_URL = 'ip';


type InviteButtonProps = {
  userId: string;
  // Optional: used if group already exists
  groupId?: string;
  // For pending groups (when groupId is not yet created)
  groupName?: string;
  subscriptionName?: string;
  planName?: string;
  amount?: number;
  cycle?: string;
  startDate?: string;
  endDate?: string;
  virtualCardId?: string;
};

const InviteButton = ({
  userId,
  groupId,
  groupName,
  subscriptionName,
  planName,
  amount,
  cycle,
  startDate,
  endDate,
  virtualCardId,
}: InviteButtonProps) => {
  const handleInvite = async () => {
    try {
      const payload = groupId
        ? { userId, groupId } // Existing group
        : {
            userId,
            groupName,
            subscriptionName,
            planName,
            amount,
            cycle,
            startDate,
            endDate,
            virtualCardId,
          }; // Pending group

      const response = await axios.post(`${API_URL}/api/groups/invite`, payload);
      console.log('Invitation sent:', response.data);
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  return <CustomButton text="Invite" onPress={handleInvite} />;
};

export default InviteButton;
