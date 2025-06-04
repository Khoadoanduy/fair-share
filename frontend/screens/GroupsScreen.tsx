import CustomButton from '@/components/CustomButton';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import axios from 'axios';

export default function GroupsScreen() {
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [search, setSearch] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);

  const handleCreateGroup = () => {
    router.push('/(group)/createGroupName')
  }
  const showAllInvitations = () => {
    router.push('/(group)/showAllInvitations')
  }

  const handleSearch = async (text: string) => {
    console.log('Searching for: ', text);
    setSearch(text);
    if (!text) {
      setSubscriptions([]); 
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/group/search-user/${text}`,{
        timeout: 10000
      });
      //Return an array of users that contains that username entered
      if (response.data?.users) {
        setUsers(response.data.users); 
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log(error)
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Groups</Text>
        <Text>Your groups will appear here</Text>
        <CustomButton text='Create Group' onPress={handleCreateGroup} />
        <CustomButton text='Show invitations' onPress={showAllInvitations}/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});