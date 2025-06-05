import { StyleSheet, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import CustomButton from "../../components/CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomInput from "@/components/CustomInput";
import { SubmitHandler, useForm } from "react-hook-form";
import ProgressDots from "@/components/ProgressDots";
import { useUserState } from "@/hooks/useUserState";

type FormatData = {
  groupName: string;
};

//User create a group name
export default function CreateGroupName() {
  const { control, handleSubmit } = useForm<FormatData>();
  const router = useRouter();
  const { hasPayment } = useUserState();
  console.log(hasPayment)
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

    //move and pass the group name to the next page
    router.push({
      pathname: "/(group)/SubscriptionInfo",
      params: { groupName: data.groupName },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create new group</Text>
        <Text style={styles.subtitle}>First, create a name for your group</Text>
        <Text style={styles.groupname}>Group name</Text>
        <CustomInput
          control={control}
          name="groupName"
          placeholder="Enter group name"
          style={styles.input}
        />
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
});
