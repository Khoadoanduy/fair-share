import CustomButton from '@/components/CustomButton';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Image, FlatList } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-expo';

export default function GroupsScreen() {
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const { user } = useUser();
  const [userId, setUserId] = useState(null);
  const clerkId = user?.id;

  const handleCreateGroup = () => {
    router.push('/(group)/createGroupName')
  }
  const showAllInvitations = () => {
    router.push('/(group)/showAllInvitations')
  }

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
  
  const handleSearch = async (text: string) => {
    console.log('Searching for: ', text);
    setSearch(text);
    if (!text) {
      setGroups([]); 
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/group/search-group/${userId}/${text}`,{
      });
      //Return an array of users that contains that username entered
      if (response.data) {
        setGroups(response.data); 
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.log(error)
      setGroups([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <CustomButton text='Create Group' onPress={handleCreateGroup}/>
        <View style={styles.searchbar}>
          {/* <Image source={require('../../assets/search.png')} style={styles.icon} /> */}
          <TextInput
            style={styles.searchText}
            placeholder="Search subscription"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => handleSearch(search)}
            returnKeyType="search"
          />
          {/* <Image source={require('../../assets/filter.png')} style={styles.icon} /> */}
        </View>

        {groups.length > 0 ? (
        <View style={styles.userContainer}>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.eachSubscription}>
                <View>
                  <Text style={styles.username}>{item.groupName} {item.lastName}</Text>
                  <Text style={styles.inviteFriends}>{item.groupName}</Text>
                </View>
              </View>
            )}
          />
        </View>
        ) :<Text style={styles.emptyText}>No subscription found.</Text> }
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
    justifyContent: 'space-between'
  },
  content: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 40,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4A3DE3',
    alignSelf: 'center'
  },
  subtitle: {
    alignSelf:'center',
    color: '#64748B',
    fontSize: 14,
  },
  inviteFriends: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8
  },
  searchbar: {
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    height: 48
  },
  linkInvite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  userContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  line: {
    alignSelf: 'center',
    width: '100%',
    marginBottom: 10
  },
  buttonLink: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    marginBottom: 65,
    marginRight: 20,
    marginLeft: 20,
    height: 50,
  }
});