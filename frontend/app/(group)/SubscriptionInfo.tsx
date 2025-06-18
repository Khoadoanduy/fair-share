import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, SafeAreaView, Pressable, Image, TouchableOpacity, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';
import ProgressDots from '@/components/ProgressDots';
import { Ionicons } from '@expo/vector-icons';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { useUser } from '@clerk/clerk-expo';

type FormatData = {
  subscriptionId?: string;
  subscriptionName: string;
  category: string;
  planName: string;
  amount: string;
  day: string;
  cycle: string;
  currency: string;
  logo: string;
};

type Subscription = {
  id: string;
  name: string;
  logo: string;
  category: string;
};

export default function SubscriptionScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id;
  const { groupName } = useLocalSearchParams();
  const { control, handleSubmit, setValue, watch } = useForm<FormatData>({
    defaultValues: {
      currency: 'USD',
      cycle: 'monthly',
      day: '1'
    }
  });

  // Watch the day and cycle values to calculate total days
  const dayValue = watch('day');
  const cycleValue = watch('cycle');
  const userFromMongo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/`, {
        params: {
          clerkID: clerkId
        }
      })
      return response.data.id
    }
    catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [suggestedSubscriptions, setSuggestedSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Helper for dropdown state management
  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const isDropdownOpen = (dropdown: string) => activeDropdown === dropdown;

  // Load suggested subscriptions
  useEffect(() => {
    const fetchSuggestedSubscriptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/subscriptions/popular`);
        setSuggestedSubscriptions(response.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch popular subscriptions:', error);
      }
    };
    fetchSuggestedSubscriptions();
  }, []);

  // Search subscriptions
  useEffect(() => {
    if (searchQuery.length === 0) {
      setSubscriptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/subscriptions`, {
          params: { search: searchQuery }
        });
        setSubscriptions(response.data);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setValue('subscriptionId', subscription.id);
    setValue('subscriptionName', subscription.name);
    setValue('category', subscription.category.toLowerCase());
    setValue('logo', subscription.logo);
    setActiveDropdown(null);
  };

  const handleCreateCustomSubscription = () => {
    router.push({
      pathname: '/(group)/customSubscription',
      params: { groupName }
    });
  };
  const calculateTotalDays = (dayValue: string, cycle: string): number => {
    // Parse the day value - handle decimal numbers
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

  // Get the current calculated days for display
  const getCurrentCalculatedDays = (): number => {
    return calculateTotalDays(dayValue || '1', cycleValue || 'monthly');
  };

  const handleCreateGroup = async (info: FormatData) => {
    if (!info.subscriptionName || !info.planName || !info.amount || !info.cycle || !info.category) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    // Validate day input
    const parsedDay = parseFloat(info.day);
    if (isNaN(parsedDay) || parsedDay <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number for the payment frequency');
      return;
    }

    try {
      const leaderId = await userFromMongo();
      const cycleDays = calculateTotalDays(info.day, info.cycle);

      const response = await axios.post(`${API_URL}/api/group/create`, {
        groupName,
        userId: leaderId,
        subscriptionId: info.subscriptionId,
        subscriptionName: info.subscriptionName,
        planName: info.planName,
        amount: parseFloat(info.amount),
        cycle: info.cycle,
        cycleDays: cycleDays,
        paymentFrequency: parseFloat(info.day), // Store the original frequency value
        category: info.category,
        logo: info.logo,
      });

      const groupId = response.data.groupId;

      router.push({
        pathname: '/(group)/inviteMember',
        params: { groupId: response.data.groupId },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  // Dropdown options
  const categoryOptions: DropdownOption[] = [
    { label: 'Streaming', value: 'streaming' },
    { label: 'Music', value: 'music' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Productivity', value: 'productivity' },
    { label: 'Fitness', value: 'fitness' },
    { label: 'Food Delivery', value: 'food delivery' }, 
    { label: 'News', value: 'news' },                   
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      {activeDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        />
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Create new group</Text>
        <Text style={styles.subtitle}>Next, enter some subscription details</Text>

        <View style={styles.formContainer}>
          {/* Subscription Search */}
          <Text style={styles.label}>Subscription</Text>
          <Pressable
            style={styles.searchInput}
            onPress={() => toggleDropdown('subscription')}
          >
            {selectedSubscription ? (
              <View style={styles.selectedSubscription}>
                <Image source={{ uri: selectedSubscription.logo }} style={styles.subscriptionLogo} />
                <Text style={styles.inputText}>{selectedSubscription.name}</Text>
              </View>
            ) : (
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#888" />
                <Text style={styles.placeholderText}>Search subscription</Text>
              </View>
            )}
            <Ionicons name="chevron-down" size={20} color="#888" />
          </Pressable>

          {/* Subscription dropdown */}
          {isDropdownOpen('subscription') && (
            <View style={styles.dropdownMenu}>
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#888" />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Search subscription"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              {searchQuery.length === 0 ? (
                <>
                  <Text style={styles.dropdownHeader}>Suggested</Text>
                  {suggestedSubscriptions.map(sub => (
                    <Pressable
                      key={sub.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSubscription(sub)}
                    >
                      <Image source={{ uri: sub.logo }} style={styles.dropdownLogo} />
                      <Text style={styles.dropdownText}>{sub.name}</Text>
                    </Pressable>
                  ))}
                  <View style={styles.divider} />
                  <Pressable
                    style={styles.customOption}
                    onPress={handleCreateCustomSubscription}
                  >
                    <Text style={styles.customOptionText}>Don't see your subscription?</Text>
                    <Text style={styles.customOptionSubtext}>Create a custom subscription</Text>
                    <View style={styles.customButton}>
                      <Text style={styles.customButtonText}>Custom</Text>
                    </View>
                  </Pressable>
                </>
              ) : (
                subscriptions.length > 0 ? (
                  subscriptions.map(sub => (
                    <Pressable
                      key={sub.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSubscription(sub)}
                    >
                      <Image source={{ uri: sub.logo }} style={styles.dropdownLogo} />
                      <Text style={styles.dropdownText}>{sub.name}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.noResults}>No results found</Text>
                )
              )}
            </View>
          )}

          {/* Category field */}
          <Text style={styles.label}>Category</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { value } }) => (
              <CustomDropdown
                options={categoryOptions}
                value={value}
                placeholder="Select subscription category"
                onChange={(val) => setValue('category', val)}
                isOpen={isDropdownOpen('category')}
                setIsOpen={() => toggleDropdown('category')}
                style={styles.dropdownInput}
                menuStyle={{
                  position: 'absolute',
                  top: 195,
                  left: 0,
                  right: 0,
                  zIndex: 100,
                }}
              />
            )}
          />

          {/* Payment every with enhanced calculation display */}
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
                  isOpen={isDropdownOpen('cycle')}
                  setIsOpen={() => toggleDropdown('cycle')}
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
                  isOpen={isDropdownOpen('currency')}
                  setIsOpen={() => toggleDropdown('currency')}
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

          {/* Plan */}
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

// Consolidated and simplified styles
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 20,
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

  // Headers
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
    color: '#000',
  },

  // Calculation display
  calculationDisplay: {
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  calculationText: {
    fontSize: 14,
    color: '#4A3DE3',
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Rows and containers
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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

  // Inputs base styles
  dropdownBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
  },

  // Input specific styles
  dropdownInput: {
    paddingVertical: 12,
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
    paddingVertical: 0,
  },
  currencyInput: {
    width: '30%',
    paddingVertical: 0,
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
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 5,
    height: 50,
  },

  // Dropdown menus
  dropdownMenuBase: {
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
  },
  dropdownMenu: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    padding: 16,
    elevation: 10,
  },

  // Dropdown content
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
  dropdownHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },

  // Subscription search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInputField: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    marginLeft: 8,
  },
  selectedSubscription: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  dropdownLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
  },

  // Custom option
  customOption: {
    padding: 12,
    marginTop: 4,
  },
  customOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
  },
  customButton: {
    backgroundColor: '#4353FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  customButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  noResults: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 12,
  },
});