import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, SafeAreaView, Pressable, Image, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';
import ProgressDots from '@/components/ProgressDots';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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
  const { groupName } = useLocalSearchParams();
  const { control, handleSubmit, setValue } = useForm<FormatData>({
    defaultValues: {
      currency: 'USD',
      cycle: 'monthly',
      day: '1'
    }
  });

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
        category: info.category
      });
      console.log(response.data.groupId);

      router.push({
        pathname: '/(group)/InviteMember',
        params: { groupId: response.data.groupId },
      });
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

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (showCycleDropdown) {
      setShowCycleDropdown(false);
    }
    if (showCurrencyDropdown) {
      setShowCurrencyDropdown(false);
    }
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
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 90,
          }}
          activeOpacity={1}
          onPress={handleOutsideClick}
        />
      )}

      {showCycleDropdown && (
        <View style={[
          styles.dropdownMenuSmall,
          {
            top: 380,
            left: 20 + (0.52 * (Dimensions.get('window').width - 40)),
            width: 0.48 * (Dimensions.get('window').width - 40),
          }
        ]}>
          {cycleOptions.map(option => (
            <Pressable
              key={option.value}
              style={styles.dropdownItem}
              onPress={() => {
                setValue('cycle', option.value);
                setShowCycleDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {showCurrencyDropdown && (
        <View style={[
          styles.dropdownMenuSmall,
          {
            top: 470,
            left: 20,
            width: 0.3 * (Dimensions.get('window').width - 40),
          }
        ]}>
          {currencyOptions.map(option => (
            <Pressable
              key={option.value}
              style={styles.dropdownItem}
              onPress={() => {
                setValue('currency', option.value);
                setShowCurrencyDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
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
              keyboardType="numeric"
              style={styles.dayInput}
            />

            <Controller
              control={control}
              name="cycle"
              rules={{ required: true }}
              render={({ field: { value } }) => (
                <Pressable
                  style={styles.simpleDropdown}
                  onPress={() => setShowCycleDropdown(!showCycleDropdown)}
                >
                  <Text style={styles.dropdownValue}>
                    {value ? cycleOptions.find(opt => opt.value === value)?.label : 'Select cycle'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </Pressable>
              )}
            />
          </View>

          <Text style={styles.label}>Amount</Text>
          <View style={styles.rowContainer}>
            <Controller
              control={control}
              name="currency"
              render={({ field: { value } }) => (
                <Pressable
                  style={styles.currencyInput}
                  onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                >
                  <Text style={styles.dropdownValue}>
                    {value ? currencyOptions.find(opt => opt.value === value)?.label : 'Currency'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#888" />
                </Pressable>
              )}
            />

            <CustomInput
              control={control}
              name="amount"
              placeholder="Amount"
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          <Text style={styles.label}>Plan</Text>
          <CustomInput
            control={control}
            name="planName"
            placeholder="Enter subscription plan"
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
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
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
    alignSelf: 'center'
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
    paddingHorizontal: 20,
    paddingBottom: 120, // Add space for fixed button container
  },

  // Form container and labels
  formContainer: {
    width: '100%',
    marginTop: 16,
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
  addImageText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
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
    paddingHorizontal: 20,
    paddingBottom: 40, // Reduced from 30
    backgroundColor: 'white',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});