import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function Visualization() {
  const subscriptions = useLocalSearchParams();
  
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}
