import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, SafeAreaView, Pressable, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import axios from 'axios';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import CustomInput from '@/components/CustomInput';
import ProgressDots from '@/components/ProgressDots';
import { Ionicons } from '@expo/vector-icons';

type FormatData = {
  subscriptionId?: string;
  subscriptionName: string;
  category: string;
  planName: string;
  amount: string;
  day: string;
  cycle: string;
  currency: string;
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
  // Get group name from previous page
  const { groupName } = useLocalSearchParams();
  const { control, handleSubmit, setValue, watch } = useForm<FormatData>({
    defaultValues: {
      currency: 'USD',
      cycle: 'monthly',
      day: '1'
    }
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCycleDropdown, setShowCycleDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [suggestedSubscriptions, setSuggestedSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Load suggested subscriptions on mount
  useEffect(() => {
    const fetchSuggestedSubscriptions = async () => {
      try {
        // Get popular subscriptions for suggested list
        const response = await axios.get(`${API_URL}/api/subscriptions/popular`);
        setSuggestedSubscriptions(response.data.slice(0, 5)); // Take top 5
      } catch (error) {
        console.error('Failed to fetch popular subscriptions:', error);
      }
    };

    fetchSuggestedSubscriptions();
  }, []);

  // Search for subscriptions when query changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchSubscriptions = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/subscriptions`, {
            params: { search: searchQuery }
          });
          setSubscriptions(response.data);
        } catch (error) {
          console.error('Failed to fetch subscriptions:', error);
        }
      };

      const timer = setTimeout(() => {
        fetchSubscriptions();
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSubscriptions([]);
    }
  }, [searchQuery]);

  const handleSelectSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setValue('subscriptionId', subscription.id);
    setValue('subscriptionName', subscription.name);
    setValue('category', subscription.category.toLowerCase());
    setShowDropdown(false);
  };

  const handleCreateCustomSubscription = () => {
    router.push({
      pathname: '/(group)/CustomSubscription',
      params: { groupName }
    });
  };

  // Create group
  const handleCreateGroup: SubmitHandler<FormatData> = async (info) => {
    if (!info.subscriptionName || !info.planName || !info.amount || !info.cycle) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/groups/create`, {
        groupName,
        subscriptionId: info.subscriptionId,
        subscriptionName: info.subscriptionName,
        planName: info.planName,
        amount: parseFloat(info.amount),
        cycle: info.cycle,
      });
      console.log(response.data.groupId);

      // If successfully create group, move and give groupId to next page to invite members
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

  const categoryOptions = [
    { label: 'Streaming', value: 'streaming' },
    { label: 'Music', value: 'music' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Productivity', value: 'productivity' },
    { label: 'Cloud Storage', value: 'cloud_storage' },
    { label: 'Fitness', value: 'fitness' },
  ];

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
    if (showCategoryDropdown) {
      setShowCategoryDropdown(false);
    }
    if (showCycleDropdown) {
      setShowCycleDropdown(false);
    }
    if (showCurrencyDropdown) {
      setShowCurrencyDropdown(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setValue('category', category);
    setShowCategoryDropdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {(showDropdown || showCategoryDropdown || showCycleDropdown || showCurrencyDropdown) && (
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

      {showDropdown && (
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

      {showCategoryDropdown && (
        <View style={[styles.dropdownMenu, { top: 244 }]}>
          {categoryOptions.map(category => (
            <Pressable
              key={category.value}
              style={styles.dropdownItem}
              onPress={() => handleCategorySelect(category.value)}
            >
              <Text style={styles.dropdownText}>{category.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {showCycleDropdown && (
        <View style={[
          styles.dropdownMenuSmall,
          {
            top: 380, // Adjust this value based on position
            left: 20 + (0.52 * (Dimensions.get('window').width - 40)), // Position at right side
            width: 0.48 * (Dimensions.get('window').width - 40), // Same width as input
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
            top: 470, // Adjust this value based on position
            left: 20,
            width: 0.3 * (Dimensions.get('window').width - 40), // Same width as input
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
          <Text style={styles.label}>Subscription</Text>
          <Pressable
            style={styles.searchInput}
            onPress={() => setShowDropdown(!showDropdown)}
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

          <Text style={styles.label}>Category</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View style={styles.categoryContainer}>
                <Pressable
                  style={styles.dropdownInput}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={[styles.inputText, !value && styles.placeholderText]}>
                    {value ? categoryOptions.find(opt => opt.value === value)?.label : 'Select subscription category'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </Pressable>
              </View>
            )}
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
              render={({ field: { onChange, value } }) => (
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
              render={({ field: { onChange, value } }) => (
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
            placeholder="Enter plan name"
            style={styles.planInput}
          />
        </View>
      </View>

      {/* Bottom section with dots and button */}
        <ProgressDots totalSteps={3} currentStep={2} />
        <CustomButton
          text="Next"
          onPress={handleSubmit(handleCreateGroup)}
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container and main layout styles
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between', // This pushes content to top and bottom
  },
  content: {
    paddingHorizontal: 20,
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

  // Form container and labels
  formContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8, // Reduced from 10
    marginTop: 16, // Reduced from 20
    color: '#000',
  },

  // Inputs and search
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 5,
    height: 50, // Added to match others
  },

  // Reduce the height of input boxes
  dayInput: {
    width: '48%',
    height: 50, // Reduced from 56
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12, // Reduced from 15
    paddingHorizontal: 16,
  },

  // Update other input heights to match
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced padding
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50, // Reduced from 56
  },

  // Fixed payment row inputs to be equal size
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cycleInput: {
    width: '48%',
    height: 50, // Reduced
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },

  simpleDropdown: {
    width: '48%',
    height: 50, // Reduced
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

  // Amount row inputs
  currencyInput: {
    width: '30%',
    height: 50, // Reduced
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
    height: 50, // Reduced
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16, // Ensure consistent padding
  },

  // Plan input
  planInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
    marginBottom: 20, // Added margin to create space before footer
    paddingHorizontal: 16, // Ensure consistent padding
  },

  // Footer section with dots and button
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 80, // Space for tab bar
    marginTop: 30, // Add space between form and footer
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14, // Reduced from 16
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 50
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Dropdown modal styles
  dropdownMenu: {
    position: 'absolute',
    top: 114, // Position below header and title
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
    marginTop: 4, // Small gap from input
  },
  dropdownHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
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

  // New styles for category container
  categoryContainer: {
    width: '100%',
    position: 'relative',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16, // Make consistent with other input text
    marginLeft: 8, // Add spacing after the search icon
  },
  noResults: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  selectedSubscription: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4, // Add some space between border and icon
  },
  subscriptionLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  dropdownValue: {
    fontSize: 16,
    color: '#000',
  },
  // Adjust the bottom container to stay at bottom
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
});