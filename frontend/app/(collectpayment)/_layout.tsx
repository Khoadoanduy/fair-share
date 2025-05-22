import { Stack } from "expo-router";
import BackButton from "@/components/BackButton";

export default function CollectPaymentLayout() {
  return (
    <Stack
      screenOptions={{
        headerLeft: () => <BackButton />,
        headerShown: true,
      }}
    >
    </Stack>
  );
}
