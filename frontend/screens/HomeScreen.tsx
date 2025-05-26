import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import PaymentMethod from "@/components/PaymentMethod";
import Noti from "@/components/TestNoti";
import { sendTestNotification } from "@/utils/notificationUtils";

export default function HomeScreen() {
  const { user } = useUser();

  const handleSendNotification = async (): Promise<void> => {
    try {
      await sendTestNotification();
      Alert.alert('Success!', 'Notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Noti />
        
        {/* Notification Test Button */}
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={handleSendNotification}
        >
          <Text style={styles.notificationButtonText}>🔔 Test Notification</Text>
        </TouchableOpacity>
        
        <PaymentMethod/>
        
        {user ? (
          <>
            <Image
              source={{ uri: user?.imageUrl }}
              style={styles.profileImage}
            />
            <Text style={styles.welcomeText}>
              Welcome,{" "}
              {user?.fullName || `${user?.firstName} ${user?.lastName}`}
            </Text>
            <Text style={styles.subtitle}>
              What would you like to do today?
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.welcomeText}>Welcome to Fair Share</Text>
            <Text style={styles.subtitle}>
              The easiest way to split expenses with friends and family
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  profileImage: {
    height: 100,
    aspectRatio: 1,
    borderRadius: 100,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // New styles for notification button
  notificationButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  notificationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});