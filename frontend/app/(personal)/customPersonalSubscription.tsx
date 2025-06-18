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
import { useUser } from '@clerk/clerk-expo';
import { useUserState } from '@/hooks/useUserState';
import CategoryDropdown from '@/components/CategoryDropdown';
import CustomCategoryModal from '@/components/CustomCategoryModal';

type FormatData = {
  subscriptionName: string;
  category: string;
  planName: string;
  amount: string;
  day: string;
  cycle: string;
  currency: string;
};

const CYCLE_OPTIONS: DropdownOption[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const CURRENCY_OPTIONS: DropdownOption[] = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'JPY (¥)', value: 'JPY' },
];

const CYCLE_DAYS_MAP = {
  'weekly': 7,
  'monthly': 30,
  'yearly': 365,
};

export default function CustomPersonalSubscriptionScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useUser();
  const { subscriptionType } = useLocalSearchParams();
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [subscriptionImage, setSubscriptionImage] = useState<string | null>(null);
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const { control, handleSubmit, setValue, watch } = useForm<FormatData>({
    defaultValues: {
      currency: 'USD',
      cycle: 'monthly',
      day: '1'
    }
  });

  const watchedValues = watch(['day', 'cycle', 'category']);
  const [dayValue, cycleValue, categoryValue] = watchedValues;

  // Request image permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera roll permissions are needed to upload images.');
        }
      }
    };
    requestPermissions();
  }, []);

  const getUserMongoId = async (): Promise<string> => {
    try {
      const response = await axios.get(`${API_URL}/api/user/`, {
        params: { clerkID: user?.id }
      });
      return response.data.id;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw new Error("Failed to fetch user data");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSubscriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Error', 'Could not pick the image.');
    }
  };

  const calculateTotalDays = (dayValue: string, cycle: string): number => {
    const parsedDay = parseFloat(dayValue) || 1;
    const baseDays = CYCLE_DAYS_MAP[cycle.toLowerCase() as keyof typeof CYCLE_DAYS_MAP] || 30;
    return Math.round(parsedDay * baseDays);
  };

  const handleCreatePersonalSubscription: SubmitHandler<FormatData> = async (data) => {
    const { subscriptionName, planName, amount, cycle, category } = data;
    
    if (!subscriptionName || !planName || !amount || !cycle || !category) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      const userId = await getUserMongoId();
      const cycleDays = calculateTotalDays(data.day, cycle);
      
      const response = await axios.post(`${API_URL}/api/personal-subscription/create`, {
        userId,
        subscriptionName,
        planName,
        amount: parseFloat(amount),
        cycle,
        cycleDays,
        paymentFrequency: parseFloat(data.day),
        category,
        subscriptionType,
      });
      
      const nextRoute = subscriptionType === 'virtual' 
        ? '/(personal)/createVirtualCard'
        : '/(personal)/personalSubscriptionDetails';
        
      router.push({
        pathname: nextRoute,
        params: { subscriptionId: response.data.subscriptionId },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create personal subscription');
    }
  };

  const handleDropdownToggle = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim()) {
      setValue('category', customCategoryInput.trim().toLowerCase());
      setCustomCategoryInput('');
      setShowCustomCategoryModal(false);
    }
  };

  const handleOutsideClick = () => {
    setActiveDropdown(null);
    Keyboard.dismiss();
  };

  const handleCloseCustomCategoryModal = () => {
    setShowCustomCategoryModal(false);
    setCustomCategoryInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {activeDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleOutsideClick}
        />
      )}

      <CustomCategoryModal
        visible={showCustomCategoryModal}
        value={customCategoryInput}
        onChangeText={setCustomCategoryInput}
        onCancel={handleCloseCustomCategoryModal}
        onAdd={handleAddCustomCategory}
      />

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Add personal subscription</Text>
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

          {/* Category field */}
          <Text style={styles.label}>Category</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { value } }) => (
              <View style={styles.categoryContainer}>
                <Pressable
                  style={styles.categoryInput}
                  onPress={() => handleDropdownToggle('category')}
                >
                  <Text style={value ? styles.inputText : styles.placeholderText}>
                    {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select subscription category'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </Pressable>

                <CategoryDropdown
                  visible={activeDropdown === 'category'}
                  selectedCategory={categoryValue}
                  onSelectCategory={(category) => {
                    setValue('category', category);
                    setActiveDropdown(null);
                  }}
                  onCustomPress={() => {
                    setActiveDropdown(null);
                    setShowCustomCategoryModal(true);
                  }}
                />
              </View>
            )}
          />

          {/* Payment frequency */}
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
                  onSubmitEditing={Keyboard.dismiss}
                />
              )}
            />

            <Controller
              control={control}
              name="cycle"
              rules={{ required: true }}
              render={({ field: { value } }) => (
                <CustomDropdown
                  options={CYCLE_OPTIONS}
                  value={value}
                  placeholder="Select cycle"
                  onChange={(val) => setValue('cycle', val)}
                  isOpen={activeDropdown === 'cycle'}
                  setIsOpen={() => handleDropdownToggle('cycle')}
                  style={styles.simpleDropdown}
                  menuStyle={styles.cycleDropdownMenu}
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
                  options={CURRENCY_OPTIONS}
                  value={value}
                  placeholder="Currency"
                  onChange={(val) => setValue('currency', val)}
                  isOpen={activeDropdown === 'currency'}
                  setIsOpen={() => handleDropdownToggle('currency')}
                  style={styles.currencyInput}
                  menuStyle={styles.currencyDropdownMenu}
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
                  onSubmitEditing={Keyboard.dismiss}
                />
              )}
            />
          </View>

          {/* Plan */}
          <Text style={styles.label}>Plan</Text>
          <Controller
            control={control}
            name="planName"
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[styles.planInput, styles.inputStyle]}
                placeholder="Enter plan name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.buttonContainer}>
        <ProgressDots totalSteps={4} currentStep={3} />
        <CustomButton
          text="Next"
          onPress={handleSubmit(handleCreatePersonalSubscription)}
          size="large"
          fullWidth
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  contentContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 120,
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
  cycleDropdownMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: '48%',
    zIndex: 100,
  },
  currencyInput: {
    width: '30%',
    height: 50,
  },
  currencyDropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    width: '30%',
    zIndex: 100,
  },
  amountInput: {
    width: '67%',
    height: 50,
  },
  planInput: {
    height: 50,
    marginBottom: 20,
  },
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