import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';

type FormatData = {
  subscriptionName: string;
  planName: string;
  amount: string;
  cycle: string
};

export default function SubscriptionScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  //Get group name from previous page
  const { groupName } = useLocalSearchParams();
  const { control, handleSubmit } = useForm<FormatData>();


  //Create group
  const handleCreateGroup: SubmitHandler<FormatData> = async (info) => {
    if (!info.subscriptionName || !info.planName || !info.amount || !info.cycle) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/groups/create`, {
        groupName,
        subscriptionName: info.subscriptionName,
        planName: info.planName,
        amount: parseFloat(info.amount),
        cycle: info.cycle,
      });
      console.log(response.data.groupId);

      //If successfully create group, move and give groupId to next page to invite members
      Alert.alert('Success', 'Group created successfully!', [
        { text: 'OK', onPress: () => router.push({ pathname: '/(tabs)/(group)/inviteMember', 
                                                    params: { groupId: response.data.groupId },}) },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Subscription Info</Text>

        <CustomInput
          control={control}
          name="subscriptionName"
          placeholder="Enter subscription name"
          style={styles.input}
        />
        <CustomInput
          control={control}
          name="planName"
          placeholder="Enter plan name"
          style={styles.input}
        />
        <CustomInput
          control={control}
          name="amount"
          placeholder="Enter subscription amount"
          keyboardType='numeric'
          style={styles.input}
        />
        <CustomInput
          control={control}
          name="cycle"
          placeholder="Enter subscription cycle"
          style={styles.input}
        />
      <CustomButton text="Create Group" onPress={handleSubmit(handleCreateGroup)} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    color: '#222',
    marginLeft: 20,
    marginTop: 50
  },
  input: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginLeft: 20,
    marginRight: 20,
  },
  button: {
    backgroundColor: 'black',
    marginTop: 40,
    marginLeft: 20,
    marginRight: 20,
  }
});
