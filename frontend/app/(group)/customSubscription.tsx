import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, Pressable, Image, Platform, TouchableOpacity, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';
import ProgressDots from '@/components/ProgressDots';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { useUser } from '@clerk/clerk-expo';

type FormatData = {
  subscriptionName: string;
  category: string;
  planName: string;
  amount: string;
  day: string;
  cycle: string;
  currency: string;
};

export default function CustomSubscriptionScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id;
  const { groupName } = useLocalSearchParams();
  const { control, handleSubmit, setValue } = useForm<FormatData>({
    defaultValues: {
      currency: 'USD',
      cycle: 'monthly',
      day: '1'
    }
  });
  const userFromMongo = async () => {
        try{
            const response = await axios.get(`${API_URL}/api/user/`,{
                params:{
                    clerkID : clerkId
                }
            })
            return response.data.id
        }
        catch(error){
            console.error("Error fetching user data:", error);
        }
    }
  const [subscriptionImage, setSubscriptionImage] = useState<string | null>(null);
  const [showCycleDropdown, setShowCycleDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSubscriptionImage(uri);
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Error', 'Could not pick the image.');
    }
  };

  const handleCreateGroup: SubmitHandler<FormatData> = async (info) => {
    if (!info.subscriptionName || !info.planName || !info.amount || !info.cycle || !info.category) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      const leaderId = await userFromMongo();
      const response = await axios.post(`${API_URL}/api/group/create`, {
        groupName,
        subscriptionName: info.subscriptionName,
        planName: info.planName,
        amount: parseFloat(info.amount),
        cycle: info.cycle,
        category: info.category
      });
      const groupId = response.data.groupId;
      await axios.post(`${API_URL}/api/groupMember/${groupId}/${leaderId}`, {userRole: "leader"});
      console.log("Add group creator as leader");
      router.push({
        pathname: '/(group)/inviteMember',
        params: { groupId: response.data.groupId },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const cycleOptions: DropdownOption[] = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const currencyOptions: DropdownOption[] = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'JPY (¥)', value: 'JPY' },
  ];

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (showCycleDropdown) {
      setShowCycleDropdown(false);
    }
    if (showCurrencyDropdown) {
      setShowCurrencyDropdown(false);
    }
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      {(showCycleDropdown || showCurrencyDropdown) && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0)',
            zIndex: 90,
          }}
          activeOpacity={1}
          onPress={handleOutsideClick}
        />
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Create new group</Text>
        <Text style={styles.subtitle}>Next, enter some subscription details</Text>

        <View style={styles.formContainer}>
          {/* Subscription section with image picker and inline label/input */}
          <View style={styles.subscriptionSection}>
            <Pressable onPress={pickImage} style={styles.imageContainer}>
              {subscriptionImage ? (
                <Image source={{ uri: subscriptionImage }} style={styles.subscriptionImage} />
              ) : (
                <View style={styles.subscriptionImagePlaceholder}>
                  <Ionicons name="add-circle" size={24} color="#4A3DE3" style={styles.addIcon} />
                </View>
              )}
            </Pressable>

            <View style={styles.subscriptionTextContainer}>
              <Text style={styles.subscriptionLabel}>Subscription</Text>
              <CustomInput
                control={control}
                name="subscriptionName"
                placeholder="Enter subscription name"
                style={styles.subscriptionInput}
              />
            </View>
          </View>

          <Text style={styles.label}>Category</Text>
          <CustomInput
            control={control}
            name="category"
            placeholder="Enter subscription category"
            style={styles.input}
          />

          <Text style={styles.label}>Payment every</Text>
          <View style={styles.rowContainer}>
            <CustomInput
              control={control}
              name="day"
              placeholder="1"
              keyboardType="decimal-pad"
              style={styles.dayInput}
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <Controller
              control={control}
              name="cycle"
              rules={{ required: true }}
              render={({ field: { value } }) => (
                <CustomDropdown
                  options={cycleOptions}
                  value={value}
                  placeholder="Select cycle"
                  onChange={(val) => setValue('cycle', val)}
                  isOpen={showCycleDropdown}
                  setIsOpen={() => setShowCycleDropdown(!showCycleDropdown)}
                  style={styles.simpleDropdown}
                  menuStyle={{
                    position: 'absolute',
                    top: 52,
                    right: 0,
                    width: '48%',
                    zIndex: 100,
                  }}
                />
              )}
            />
          </View>

          <Text style={styles.label}>Amount</Text>
          <View style={styles.rowContainer}>
            <Controller
              control={control}
              name="currency"
              render={({ field: { value } }) => (
                <CustomDropdown
                  options={currencyOptions}
                  value={value}
                  placeholder="Currency"
                  onChange={(val) => setValue('currency', val)}
                  isOpen={showCurrencyDropdown}
                  setIsOpen={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  style={styles.currencyInput}
                  menuStyle={{
                    position: 'absolute',
                    top: 52,
                    left: 0,
                    width: '30%',
                    zIndex: 100,
                  }}
                  iconSize={18}
                />
              )}
            />

            <CustomInput
              control={control}
              name="amount"
              placeholder="Amount"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          <Text style={styles.label}>Plan</Text>
          <CustomInput
            control={control}
            name="planName"
            placeholder="Enter plan name"
            style={styles.planInput}
          />
        </View>
      </View>

      {/* Bottom section with dots and button */}
      <View style={styles.buttonContainer}>
        <ProgressDots totalSteps={3} currentStep={2} />
        <CustomButton
          text="Next"
          onPress={handleSubmit(handleCreateGroup)}
          size="large"
          fullWidth
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container and main layout styles
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#4A3DE3',
    alignSelf: 'center',
    marginTop: -30
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
    alignSelf: 'center'
  },

  // Content container
  contentContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Form container and labels
  formContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
    color: '#000',
  },

  // Subscription section with image
  subscriptionSection: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  imageContainer: {
    marginRight: 16,
  },
  subscriptionImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subscriptionImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  subscriptionTextContainer: {
    flex: 1,
  },
  subscriptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#000',
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
    paddingHorizontal: 16,
  },
  subscriptionInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
    paddingHorizontal: 16,
  },

  // Row container for inputs
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayInput: {
    width: '48%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  simpleDropdown: {
    width: '48%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyInput: {
    width: '30%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    width: '67%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
  },
  planInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  // Dropdown styles
  dropdownMenuSmall: {
    position: 'absolute',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    padding: 8,
    elevation: 10,
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownValue: {
    fontSize: 16,
    color: '#000',
  },

  // Button container
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
});