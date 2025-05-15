import { StyleSheet, Text, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '@/components/CustomInput';
import { SubmitHandler, useForm } from 'react-hook-form';

type FormatData = {
  groupName: string;
};

//User create a group name
export default function CreateGroupName() {
  const { control, handleSubmit } = useForm<FormatData>();
  const router = useRouter();

  const onNext: SubmitHandler<FormatData> = (data) => {
    if (!data.groupName || data.groupName.trim() === '') {
      Alert.alert('Missing Group Name', 'Please enter a group name.');
      return;
    }

    //move and pass the group name to the next page
    router.push({
      pathname: '/(tabs)/(group)/subscription',
      params: { groupName: data.groupName },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>
      <CustomInput
        control={control}
        name="groupName"
        placeholder="Enter group name"
        style={styles.input}
      />
      <CustomButton text="Next" onPress={handleSubmit(onNext)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 40,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 16
  },
});
