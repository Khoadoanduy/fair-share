import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';

const verifySchema = z.object({
  code: z.string({ message: 'Code is required' }).length(6, 'Invalid code'),
});

type VerifyFields = z.infer<typeof verifySchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'code':
      return 'code';
    default:
      return 'root';
  }
};

export default function VerifyScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
  });

  const { signUp, isLoaded, setActive } = useSignUp();

  const onVerify = async ({ code }: VerifyFields) => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        try {
          // Set BOTH flags to create proper flow
          await Promise.all([
            AsyncStorage.setItem('needsUserOnboarding', 'true'),
            AsyncStorage.setItem('onboardingComplete', 'true') // This is the critical addition
          ]);
          // Then activate the session
          await setActive({ session: signUpAttempt.createdSessionId });

          // Force navigation to refresh
          router.replace("/");
        } catch (err) {
          console.error("Error:", err);
        }
      } else {
        console.log('Verification failed');
        console.log(signUpAttempt);
        setError('root', { message: 'Could not complete the sign up' });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error);
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError('root', { message: 'Unknown error' });
      }
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('Verification code resent!');
    } catch (err) {
      console.error('Failed to resend code:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code we just sent to example@gmail.com</Text>

      <CustomInput
        control={control}
        name='code'
        placeholder='123456'
        autoFocus
        autoCapitalize='none'
        keyboardType='number-pad'
        autoComplete='one-time-code'
        style={styles.codeInput}
      />

      <CustomButton text='Verify' onPress={handleSubmit(onVerify)} />
      <Text style={styles.resend}>
        Didn’t receive the code?{' '}
        <Text onPress={handleResend} style={styles.resendText}>
          Resend
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignContent: 'center',
    padding: 20,
    gap: 20,
  },
  form: {
    gap: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#4A3DE3',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center'
  },
  link: {
    color: '#4353FD',
    fontWeight: '600',
  },
  resend: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16
  },
  resendText: {
    color: '#4A3DE3',
    fontWeight: '600',
    fontSize: 16
  },
  codeInput: {
    fontSize: 28,
    letterSpacing: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: '#4A3DE3',
    color: '#000',
  }
});
