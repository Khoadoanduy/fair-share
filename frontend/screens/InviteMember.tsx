import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
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
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();

  
  const { groupId } = useLocalSearchParams();

  const handleSearch = async (text: string) => {
    console.log('Searching for: ', text);
    setSearch(text);
    if (!text) {
      setUsers([]); 
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/groups/search-user/${text}`,{
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
            <Text style={styles.username}>{item.username}</Text>
            <InviteButton
              userId={item.id}
              groupId={groupId}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading && search.length > 0 ? (
            <Text style={styles.emptyText}>No users found.</Text>
          ) : null
        }
      />
      <CustomButton text="Back to homepage" onPress={() => router.push('/(tabs)')} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 40
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    height: 48

  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: 'black',
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eachUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  username: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontSize: 16,
  },
  button: {
    backgroundColor: 'black',
    marginTop: 30
  }
});