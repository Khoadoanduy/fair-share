import CustomButton from '@/components/CustomButton';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';


export default function GroupsScreen() {
  const router = useRouter();
  const handleCreateGroup = () => {
    router.push('/(group)/createGroupName')
  }
  const showAllInvitations = () => {
    router.push('/(group)/showAllInvitations')
  }

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