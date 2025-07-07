import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const signUpSchema = z.object({
  firstName: z
    .string({ message: "First name is required" })
    .min(1, "First name is required"),
  lastName: z
    .string({ message: "Last name is required" })
    .min(1, "Last name is required"),
  username: z
    .string({ message: "Username is required" })
    .min(1, "Username is required"),
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password should be at least 8 characters long"),
  confirmPassword: z.string({ message: "Please confirm your password" }),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case "email_address":
      return "email";
    case "password":
      return "password";
    case "first_name":
      return "firstName";
    case "last_name":
      return "lastName";
    case "username":
      return "username";
    default:
      return "root";
  }
};

export default function SignupScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  });

  const { signUp, isLoaded } = useSignUp();

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareVerification({ strategy: "email_code" });

      router.push("/verify");
    } catch (err) {
      console.log("Sign up error: ", err);
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          console.log("Error: ", JSON.stringify(error, null, 2));
          const fieldName = mapClerkErrorToFormField(error);
          console.log("Field name: ", fieldName);
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError("root", { message: "Unknown error" });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Text style={styles.title}>Create an account</Text>
            <Text style={styles.subtitle}>
              Join Fair Share to start splitting expenses with friends and family
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <CustomInput
                control={control}
                name="firstName"
                placeholder="First Name"
                autoCapitalize="words"
                autoComplete="name-given"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <CustomInput
                control={control}
                name="lastName"
                placeholder="Last Name"
                autoCapitalize="words"
                autoComplete="name-family"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="at"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <CustomInput
                control={control}
                name="username"
                placeholder="Username"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <CustomInput
                control={control}
                name="email"
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <CustomInput
                control={control}
                name="password"
                placeholder="Password"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <CustomInput
                control={control}
                name="confirmPassword"
                placeholder="Confirm Password"
                secureTextEntry
                style={styles.input}
              />
            </View>

            {errors.root && (
              <Text style={styles.errorText}>{errors.root.message}</Text>
            )}
          </View>

          <View style={styles.buttonSection}>
            <CustomButton
              text="Sign up"
              onPress={handleSubmit(onSignUp)}
              style={styles.signupButton}
            />

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Link href="/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    gap: 24,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    paddingLeft: 12,
    fontSize: 16,
    color: "#0F172A",
    borderWidth: 0,
  },
  buttonSection: {
    gap: 20,
  },
  signupButton: {
    backgroundColor: "#4A3DE3",
    borderRadius: 12,
    paddingVertical: 16,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  loginText: {
    color: "#64748B",
    fontSize: 14,
  },
  loginLink: {
    color: "#4A3DE3",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "crimson",
    fontSize: 14,
    textAlign: "center",
  },
});