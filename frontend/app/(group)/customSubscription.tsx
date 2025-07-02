import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, Pressable, Image, Platform, TouchableOpacity, Keyboard, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';
import ProgressDots from '@/components/ProgressDots';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { useUserState } from '@/hooks/useUserState';
import CustomDropdownModal from '@/components/CustomDropdownModal';
import CustomInputModal from '@/components/CustomInputModal';


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
  const { userId } = useUserState();


  // Add visibility to the destructured params
  const { groupName, visibility } = useLocalSearchParams();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<FormatData>({
    defaultValues: {
      currency: 'USD',
      cycle: 'monthly',
      day: '1',
      planName: 'standard'
    }
  });
  const dayValue = watch('day');
  const cycleValue = watch('cycle');
  const categoryValue = watch('category');

  // State for modals and dropdowns
  const [subscriptionImage, setSubscriptionImage] = useState<string | null>(null);
  const [showCycleDropdown, setShowCycleDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

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

  const calculateTotalDays = (dayValue: string, cycle: string): number => {
    const parsedDay = parseFloat(dayValue) || 1;
    // Base days for each cycle

    const cycleDaysMap: { [key: string]: number } = {
      'weekly': 7,
      'monthly': 30,
      'yearly': 365,
    };
    const baseDays = cycleDaysMap[cycle.toLowerCase()] || 30;
    // Calculate total days by multiplying base cycle days with the day value
    const totalDays = Math.round(parsedDay * baseDays);
    return totalDays;
  };

  const handleCreateGroup: SubmitHandler<FormatData> = async (info) => {
    if (!info.subscriptionName || !info.planName || !info.amount || !info.cycle || !info.category) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      const cycleDays = calculateTotalDays(info.day, info.cycle);

      // Create the group
      const response = await axios.post(`${API_URL}/api/group/create`, {
        groupName,
        subscriptionName: info.subscriptionName,
        planName: info.planName,
        amount: parseFloat(info.amount),
        cycle: info.cycle,
        cycleDays: cycleDays,
        paymentFrequency: parseFloat(info.day),
        category: info.category,
        userId: userId, 
        visibility: visibility || 'friends', 
      });
      
      const groupId = response.data.groupId;
      await axios.post(`${API_URL}/api/groupMember/${groupId}/${userId}`, { userRole: "leader" });
      router.push({
        pathname: '/(group)/inviteMember',
        params: { groupId: response.data.groupId },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const isDropdownOpen = (dropdown: string) => activeDropdown === dropdown;

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim()) {
      setValue('category', customCategoryInput.trim().toLowerCase());
      setCustomCategoryInput('');
      setShowCustomCategoryModal(false);
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
  const categoryOptions: DropdownOption[] = [
    { label: 'Streaming', value: 'streaming' },
    { label: 'Music', value: 'music' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Productivity', value: 'productivity' },
    { label: 'Cloud Storage', value: 'cloud_storage' },
    { label: 'Fitness', value: 'fitness' },
  ];
  const planNameOptions: DropdownOption[] = [
    { label: 'Standard Plan', value: 'standard' },
    { label: 'Premium Plan', value: 'premium' },
    { label: 'Family Plan', value: 'family' },
    { label: 'Student Plan', value: 'student' },
    { label: 'Other', value: 'other' },
  ]

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (showCycleDropdown) {
      setShowCycleDropdown(false);
    }
    if (showCurrencyDropdown) {
      setShowCurrencyDropdown(false);
    }
    setActiveDropdown(null);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      {(showCycleDropdown || showCurrencyDropdown || activeDropdown) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleOutsideClick}
        />
      )}

      <CustomInputModal
        visible={showCustomCategoryModal}
        value={customCategoryInput}
        onChangeText={setCustomCategoryInput}
        onCancel={() => {
          setShowCustomCategoryModal(false);
          setCustomCategoryInput('');
        }}
        onAdd={handleAddCustomCategory}
        title="Add custom category"
        subtitle="Customize category for your subscription"
        placeholder="Enter category name"
        addButtonLabel="Add"
        cancelButtonLabel="Cancel"
      />

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Create new group</Text>
        <Text style={styles.subtitle}>Next, enter some subscription details</Text>

        <View style={styles.formContainer}>
          {/* Subscription section */}
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

          {/* Category field using the imported CustomDropdown */}
          <Text style={styles.label}>Category</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { value } }) => (
              <View style={styles.categoryContainer}>
                <Pressable
                  style={styles.categoryInput}
                  onPress={() => toggleDropdown('category')}
                >
                  <Text style={value ? styles.inputText : styles.placeholderText}>
                    {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select subscription category'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </Pressable>
                <CustomDropdownModal
                  visible={activeDropdown === 'category'}
                  selectedValue={categoryValue}
                  options={[
                    { value: 'streaming', label: 'Streaming', icon: 'play' },
                    { value: 'education', label: 'Education', icon: 'school' },
                    { value: 'music', label: 'Music', icon: 'musical-notes' },
                    { value: 'news', label: 'News', icon: 'newspaper' },
                    { value: 'home', label: 'Home', icon: 'home' },
                    { value: 'fitness', label: 'Health/fitness', icon: 'fitness' },
                  ]}
                  onSelect={(category) => {
                    setValue('category', category);
                    setActiveDropdown(null);
                  }}
                  onCustomPress={() => {
                    setActiveDropdown(null);
                    setShowCustomCategoryModal(true);
                  }}
                  header="Suggested"
                  customPrompt="Don't see what you're looking for?"
                  customButtonLabel="Custom"
                />
              </View>
            )}
          />

          {/* Payment every */}
          <Text style={styles.label}>Payment every</Text>
          <View style={styles.rowContainer}>
            <Controller
              control={control}
              name="day"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.dayInput, styles.inputStyle]}
                  placeholder="1"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  blurOnSubmit={true}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              )}
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

          {/* Amount */}
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

            <Controller
              control={control}
              name="amount"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.amountInput, styles.inputStyle]}
                  placeholder="Amount"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  blurOnSubmit={true}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              )}
            />
          </View>

          {/* Plan field (generalized dropdown example) */}
          <Text style={styles.label}>Plan</Text>
          <Controller
            control={control}
            name="planName"
            render={({ field: { value } }) => (
              <View style={styles.categoryContainer}>
                <Pressable
                  style={styles.categoryInput}
                  onPress={() => toggleDropdown('planName')}
                >
                  <Text style={value ? styles.inputText : styles.placeholderText}>
                    {value ? value : 'Select plan name'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </Pressable>
                <CustomDropdownModal
                  visible={activeDropdown === 'planName'}
                  selectedValue={value}
                  options={[
                    { value: 'basic', label: 'Basic' },
                    { value: 'premium', label: 'Premium' },
                    { value: 'family', label: 'Family' },
                  ]}
                  onSelect={(plan) => {
                    setValue('planName', plan);
                    setActiveDropdown(null);
                  }}
                  header="Plans"
                  customPrompt="Don't see your plan?"
                  customButtonLabel="Custom"
                />
              </View>
            )}
          />
        </View>
      </View>

      {/* Bottom section */}
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 90,
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

  // Subscription section
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
  subscriptionInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
    paddingHorizontal: 16,
  },
  inputStyle: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 16,
  },

  // Category styles
  categoryContainer: {
    position: 'relative',
  },
  categoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
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
  },
  simpleDropdown: {
    width: '48%',
    height: 50,
  },
  currencyInput: {
    width: '30%',
    height: 50,
  },
  amountInput: {
    width: '67%',
    height: 50,
  },
  planInput: {
    height: 50,
    marginBottom: 20,
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