import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import CustomButton from '@/components/CustomButton';
import InviteButton from '@/components/InviteButton';
import { useState } from 'react';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';



type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

export default function InviteMemberScreen() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();

  const {
    groupName,
    subscriptionName,
    planName,
    amount,
    cycle,
    startDate,
    endDate,
    virtualCardId,
  } = useLocalSearchParams();

  const handleSearch = async (text: string) => {
    console.log('Searching for: ', text);
    setSearch(text);
    if (!text) {
      setUsers([]); 
      return;
    }
    setLoading(true);
    try {
      console.log("I'm at the try")
      const response = await axios.get(`${API_URL}/api/groups/search-user/${text}`,{
        timeout: 10000
      });
      console.log(response)
      // Ensure the response data is an array and not just an object
      if (response.data?.users) {
        setUsers(response.data.users); // Assuming the response contains a list of users
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log(error)
      Alert.alert('Error', 'User not found');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (userId: string) => {
    if (!invited.includes(userId)) {
      setInvited((prev) => [...prev, userId]);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/groups/create-group`, {
        groupName,
        subscriptionName,
        planName,
        amount: parseFloat(amount as string),
        cycle,
        startDate,
        endDate,
        virtualCardId,
      });

      Alert.alert('Success', 'Group created successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Invite Members</Text>

      <View style={styles.searchbar}>
        <Image source={require('../assets/search.png')} style={styles.icon} />
        <TextInput
          style={styles.searchText}
          placeholder="Enter username"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => handleSearch(search)}
          returnKeyType="search"
        />
      </View>

      {loading && <ActivityIndicator size="small" color="#555" />}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eachUser}>
            <Text>{item.username}</Text>
            <InviteButton
              userId={item.id}
              groupName={typeof groupName === 'string' ? groupName : ''}
              subscriptionName={typeof subscriptionName === 'string' ? subscriptionName : ''}
              planName={typeof planName === 'string' ? planName : ''}
              amount={typeof amount === 'string' ? parseFloat(amount) : undefined}
              cycle={typeof cycle === 'string' ? cycle : ''}
              startDate={typeof startDate === 'string' ? startDate : undefined}
              endDate={typeof endDate === 'string' ? endDate : undefined}
              virtualCardId={typeof virtualCardId === 'string' ? virtualCardId : undefined}
            />
          </View>
        )}
      />

      <CustomButton text="Create Group" onPress={handleCreateGroup} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
  },
  eachUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
});
