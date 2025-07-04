import { StyleSheet, Text, View, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import CustomButton from "../../components/CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomInput from "@/components/CustomInput";
import { SubmitHandler, useForm } from "react-hook-form";
import ProgressDots from "@/components/ProgressDots";
import { useUserState } from "@/hooks/useUserState";
import { useState, useMemo } from "react";

type FormatData = {
  groupName: string;
};

//User create a group name
export default function CreateGroupName() {
  const { control, handleSubmit } = useForm<FormatData>();
  const router = useRouter();
  const { hasPayment } = useUserState();
  const [visibility, setVisibility] = useState<'private' | 'friends'>('friends'); 
  // Memoize the visibility options to prevent text flicker
  const privateOption = useMemo(() => (
    <TouchableOpacity
      style={[styles.visibilityOption, visibility === 'private' && styles.selected]}
      onPress={() => setVisibility('private')}
      activeOpacity={0.8}
    >
      <View style={styles.radioContainer}>
        <View style={[styles.radioCircle, visibility === 'private' && styles.radioSelected]} />
        <View style={styles.textContainer}>
          <Text style={styles.visibilityTitle}>Private</Text>
          <Text style={styles.visibilityDescription}>
            Only people you invite can see and join this group.
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [visibility]);

  const friendsOption = useMemo(() => (
    <TouchableOpacity
      style={[styles.visibilityOption, visibility === 'friends' && styles.selected]}
      onPress={() => setVisibility('friends')}
      activeOpacity={0.8}
    >
      <View style={styles.radioContainer}>
        <View style={[styles.radioCircle, visibility === 'friends' && styles.radioSelected]} />
        <View style={styles.textContainer}>
          <Text style={styles.visibilityTitle}>Friends</Text>
          <Text style={styles.visibilityDescription}>
            Also post your subscription on your feed, and your friends can request to join.
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [visibility]);

  const onNext: SubmitHandler<FormatData> = (data) => {
    if (!data.groupName || data.groupName.trim() === "") {
      Alert.alert("Missing Group Name", "Please enter a group name.");
      return;
    }

    if (hasPayment == false) {
      Alert.alert(
        "Payment Method Required",
        "Please add a payment method in your profile before creating a group.",
        [
          {
            text: "Go to Profile",
            onPress: () => router.push("/profile"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return;
    }

    //move and pass the group name and visibility to the next page
    router.push({
      pathname: '/(group)/SubscriptionInfo',
      params: {
        groupName: data.groupName,
        visibility: visibility
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create new group</Text>
        <Text style={styles.subtitle}>First, create a name and set visibility for your group</Text>
        <Text style={styles.groupname}>Group name</Text>
        <CustomInput
          control={control}
          name="groupName"
          placeholder="Enter group name"
          style={styles.input}
        />

        <Text style={styles.visibilityLabel}>Visibility</Text>

        {privateOption}
        {friendsOption}
      </View>
      <ProgressDots totalSteps={3} currentStep={1} />
      <CustomButton
        text="Next"
        onPress={handleSubmit(onNext)}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
  },
  title: {
    marginTop: -40,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
    color: "#4A3DE3",
  },
  subtitle: {
    alignSelf: "center",
    color: "#64748B",
    fontSize: 15,
    marginBottom: 50,
  },
  groupname: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 15,
  },
  input: {
    marginBottom: 40,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 16,
  },
  button: {
    marginBottom: 50,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 15,
  },
  visibilityOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  selected: {
    borderColor: "#4A3DE3",
    backgroundColor: "#F8F9FF",
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: {
    borderColor: "#4A3DE3",
    backgroundColor: "#4A3DE3",
  },
  textContainer: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});