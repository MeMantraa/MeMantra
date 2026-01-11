import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import logo from '../assets/logo.png';
import { authService } from '../services/auth.service';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';

export default function VerifyCodeScreen({ route, navigation }: any) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // Start with 60 seconds cooldown
  const { colors } = useTheme();

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (index === 5 && text && newCode.every((digit) => digit !== '')) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeString?: string) => {
    const finalCode = codeString || code.join('');

    if (finalCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyResetCode(email, finalCode);

      if (response.status === 'success') {
        Alert.alert('Success', 'Code verified successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ResetPassword', { email, code: finalCode });
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Invalid verification code');
        // Clear code inputs on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error('Verify code error:', error);
      const errorMessage =
        error.response?.data?.message || 'Invalid or expired code. Please try again.';
      Alert.alert('Error', errorMessage);
      // Clear code inputs on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);

      if (response.status === 'success') {
        Alert.alert('Success', 'A new verification code has been sent to your email');
        setResendCooldown(60);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        // Handle rate limiting
        if (response.waitTime) {
          setResendCooldown(response.waitTime);
        }
        Alert.alert('Error', response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('Resend code error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to resend code. Please try again.';
      const waitTime = error.response?.data?.waitTime;

      if (waitTime) {
        setResendCooldown(waitTime);
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View className="flex-1 justify-center items-center p-[24px]">
          <View className="mb-[30px] -mt-[35px] items-center">
            <Image source={logo} className="w-[200px] h-[200px]" resizeMode="contain" />
          </View>

          <View className="w-full max-w-[400px]">
            <AppText className="text-[#ffffff] text-[24px] font-bold text-center mb-[10px]">
              Enter Verification Code
            </AppText>
            <AppText className="text-[#ffffff] text-[14px] text-center mb-[30px] opacity-80">
              We've sent a 6-digit code to {email}
            </AppText>
            <AppText className="text-[#ffffff] text-[12px] text-center mb-[20px] opacity-70">
              Code expires in 10 minutes
            </AppText>

            {/* 6-digit code input */}
            <View className="flex-row justify-between mb-[30px]">
              {code.map((digit, index) => (
                <TextInput
                  key={`digit-${index}`}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className="bg-[#ffffff] rounded-[12px] text-[24px] font-bold text-center border border-[#e0e0e0]"
                  style={{
                    width: 50,
                    height: 60,
                    color: '#000000', // Black text for visibility
                  }}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.secondary }}
              className="rounded-[30px] p-[14px] items-center mt-[8px]"
              onPress={() => handleVerifyCode()}
              disabled={loading || code.includes('')}
            >
              <AppText className="text-[#ffffff] text-[18px] font-semibold">
                {loading ? 'Verifying...' : 'Verify Code'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mt-[20px]"
              onPress={handleResendCode}
              disabled={resendCooldown > 0 || loading}
            >
              <AppText
                className={`text-[14px] ${resendCooldown > 0 ? 'opacity-50' : ''}`}
                style={{ color: '#fff' }}
              >
                Didn't receive the code?{' '}
                <AppText className="text-[#ffffff] text-[14px] font-bold">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </AppText>
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
