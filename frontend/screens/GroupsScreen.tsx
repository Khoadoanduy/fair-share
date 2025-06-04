import CustomButton from '@/components/CustomButton';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';


export default function GroupsScreen() {
  const router = useRouter();
  const handleCreateGroup = () => {
    router.push('/(group)/CreateGroupName')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Groups</Text>
        <Text>Your groups will appear here</Text>
        <CustomButton text='Create Group' onPress={handleCreateGroup} />
        <Pressable
          style={{ backgroundColor: '#4A3DE3', padding: 15, borderRadius: 8, margin: 20 }}
          onPress={() => router.push({
            pathname: '/(group)/SubscriptionDetails',
            params: { groupId: 'test-group-id' }
          })}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Subscription Details</Text>
        </Pressable>
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