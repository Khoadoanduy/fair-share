import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import LogInWith from '../components/LogInWith';
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import SignInWith from "../components/SignInWith";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const signInSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password should be at least 8 characters long"),
});

type SignInFields = z.infer<typeof signInSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case "identifier":
      return "email";
    case "password":
      return "password";
    default:
      return "root";
  }
};

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
  });

  const { signIn, isLoaded, setActive } = useSignIn();

  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.log("Sign in failed");
        setError("root", { message: "Sign in could not be completed" });
      }
    } catch (err) {
      console.log("Sign in error: ", JSON.stringify(err, null, 2));

      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error);
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
            <Text style={styles.title}>Log In</Text>
            <Text style={styles.subtitle}>
              Welcome back to Fair Share
            </Text>
            <View style={{ height: 30 }} />
            <View style={styles.socialButtonContainer}>
              <LogInWith
                strategy="oauth_google"
                style={styles.googleLogInButton}
              />
            </View>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.form}>
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

            {errors.root && (
              <Text style={styles.errorText}>{errors.root.message}</Text>
            )}
          </View>

          <View style={styles.buttonSection}>
            <CustomButton
              text="Log in"
              onPress={handleSubmit(onSignIn)}
              style={styles.signInButton}
            />

            <View style={styles.signupLinkContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign up</Text>
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
  signInButton: {
    backgroundColor: "#4353FD",
    borderRadius: 12,
    paddingVertical: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  socialButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
    width: "100%",
  },
  googleLogInButton: {
    backgroundColor: "#4353FD",
    borderRadius: 8,
    paddingVertical: 16,
    width: "100%",
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  signupText: {
    color: "#64748B",
    fontSize: 14,
  },
  signupLink: {
    color: "#4353FD",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "crimson",
    fontSize: 14,
    textAlign: "center",
  },
});