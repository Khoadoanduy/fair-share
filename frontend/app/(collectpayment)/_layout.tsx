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
      <Stack.Screen
        name="CollectPayment"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="StripePayment"
        options={{
          title: "Payment Setup",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
