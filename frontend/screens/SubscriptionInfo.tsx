import { View, Text, StyleSheet, TextInput, Alert, SafeAreaView, Pressable, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';
import Dropdown from '@/components/DropDown';
import ProgressDots from '@/components/ProgressDots';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';


type FormatData = {
  subscriptionName: string;
  planName: string;
  amount: string;
  cycle: string;
  currency: string;
};

export default function SubscriptionScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  //Get group name from previous page
  const { groupName } = useLocalSearchParams();
  const { control, handleSubmit } = useForm<FormatData>();

  const [subscriptionImage, setSubscriptionImage] = useState<string | null>(null);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // lets user crop the image
        aspect: [1, 1], // force square aspect ratio (perfect for circle)
        quality: 1,
      });

      if (!result.canceled) {
        // For newer versions result.assets is an array
        const uri = result.assets[0].uri;
        setSubscriptionImage(uri);
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Error', 'Could not pick the image.');
    }
  };

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
      router.push({ pathname: '/(group)/inviteMember', 
                    params: { groupId: response.data.groupId },});
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const cycleOptions = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const currencyOptions = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'JPY (¥)', value: 'JPY' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create new group</Text>
        <Text style={styles.subtitle}>Next, enter some subscription details</Text>
        <View style={styles.subscriptionRow}>
          <Pressable onPress={pickImage} >
              {subscriptionImage ? (
                <Image source={{ uri: subscriptionImage }} style={styles.subscriptionImage} />
              ) : (
                <View style={[styles.subscriptionImage, styles.placeholder]}>
                  <Text style={{ color: '#888' }}>Add Image</Text>
                </View>
              )}
          </Pressable>
          <View style={styles.subscription}>
            <Text style={styles.fields}>Subscription</Text>
            <CustomInput
              control={control}
              name="subscriptionName"
              placeholder="Enter subscription name"
              style={styles.input}
            />
          </View>
        </View>
        <Text style={styles.fields}>Category</Text>
        <CustomInput
          control={control}
          name="category"
          placeholder="Enter subscription category"
          style={styles.input}
        />
        <Text style={styles.fields}>Payment every</Text>
        <View style={styles.dropdown}>
          <CustomInput
            control={control}
            name="day"
            placeholder="Day"
            keyboardType='numeric'
            style={[styles.input, styles.dayInput]}
          />
          <Controller
            control={control}
            name="cycle"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <Dropdown
                options={cycleOptions}
                selectedValue={value}
                placeholder="Select cycle"
                onSelect={onChange}
                style={styles.cycle}
              />
            )}
          />
        </View>
        <Text style={styles.fields}>Amount</Text>
        <View style={styles.dropdown}>
          <Controller
            control={control}
            name="currency"
            defaultValue={currencyOptions[0].value}
            render={({ field: { onChange, value } }) => (
              <Dropdown
                options={currencyOptions}
                selectedValue={value}
                placeholder="Currency"
                onSelect={onChange}
                style={styles.currency}
              />
            )}
          />
          <CustomInput
            control={control}
            name="amount"
            placeholder="Amount"
            keyboardType='numeric'
            style={[styles.input, styles.amount]}
          />
        </View>
        <Text style={styles.fields}>Plan</Text>
        <CustomInput
          control={control}
          name="planName"
          placeholder="Enter subscription plan"
          style={styles.input}
        />
      </View>
      <ProgressDots totalSteps={3} currentStep={2}/>
      <CustomButton text="Next" onPress={handleSubmit(handleCreateGroup)} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    alignSelf: 'center',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    color: '#4A3DE3',
    marginLeft: -20,
  },
  subtitle: {
    alignSelf:'center',
    color: '#64748B',
    fontSize: 14,
    marginLeft: -20,
    marginBottom: 30
  },
  fields: {
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginRight: 20,
  },
  button: {
    marginLeft: 20,
    marginRight: 20,
  },
  dropdown: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayInput: {
    width: 173.5,
    marginRight: 10
  },
  cycle: {
    width: 150,
  },
  currency: {
    width: 100,
    marginRight: 10,
  },
  amount: {
    flex: 1
  }, 
  subscriptionImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscription: {
    flex: 1
  }
});
