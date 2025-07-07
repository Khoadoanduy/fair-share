import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import CustomButton from '@/components/CustomButton';
import InviteButton from '@/components/InviteButton';
import { useState } from 'react';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ProgressDots from '@/components/ProgressDots';


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
        <Text style={styles.title}>Add members</Text>
        <Text style={styles.subtitle}>Send invitation to members to join the group</Text>
        <View style={styles.searchbar}>
          <Image source={require('../../assets/search.png')} style={styles.icon} />
          <TextInput
            style={styles.searchText}
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => handleSearch(search)}
            returnKeyType="search"
          />
          <Image source={require('../../assets/nav-arrow-down.png')} style={styles.icon} />
        </View>

        {loading && <ActivityIndicator size="small" color="#555" />}
        {users.length > 0 ? (
        <View style={styles.userContainer}>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.eachUser}>
                <View>
                  <Text style={styles.username}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.inviteFriends}>{item.username}</Text>
                </View>
                <InviteButton
                  userId={item.id}
                  groupId={groupId}
                />
              </View>
            )}
          />
          <Image source={require('../../assets/line.png')} style={styles.line}/>
          <View style={styles.linkInvite}>
            <View>
              <Text style={styles.username}>Looking for someone else?</Text>
              <Text style={styles.inviteFriends}>Invite friends to FairShare</Text>
            </View>
            <CustomButton text="Invite" style={styles.buttonLink}/>
          </View>
        </View>
        ) :<Text style={styles.emptyText}>No users found.</Text> }
      </View>
      <ProgressDots totalSteps={4} currentStep={4}/>      
      <CustomButton text="Next" onPress={() => router.push({pathname: '/(group)/newGroupDetails', params: { groupId: groupId }})} style={styles.button} />
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