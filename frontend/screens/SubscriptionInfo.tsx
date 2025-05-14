import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { groupName } = useLocalSearchParams();

  const [subscriptionName, setSubscriptionName] = useState('');
  const [planName, setPlanName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('');
  const [virtualCardId, setVirtualCardId] = useState('');

  const handleNext = () => {
    if (!subscriptionName || !planName || !amount || !cycle) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    router.push({
      pathname: '/groups/inviteMember',
      params: {
        groupName,
        subscriptionName,
        planName,
        amount,
        cycle,
        virtualCardId,
        startDate: new Date().toISOString(), // Example default
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), // +6 months
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Subscription Info</Text>

      <TextInput
        placeholder="Subscription Name"
        value={subscriptionName}
        onChangeText={setSubscriptionName}
        style={styles.input}
      />
      <TextInput
        placeholder="Plan Name"
        value={planName}
        onChangeText={setPlanName}
        style={styles.input}
      />
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Cycle (e.g. monthly)"
        value={cycle}
        onChangeText={setCycle}
        style={styles.input}
      />
      <TextInput
        placeholder="Virtual Card ID (optional)"
        value={virtualCardId}
        onChangeText={setVirtualCardId}
        style={styles.input}
      />

      <CustomButton text="Next" onPress={handleNext} />
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    fontSize: 16,
  },
});
