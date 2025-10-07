import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import logo from '../assets/logo.png';

export default function SignUpScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return;
    }
    console.log('Sign up pressed', { username, email, password });
  };

  const handleLoginRedirect = () => {
    navigation.navigate('Login');
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} />
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={handleLoginRedirect}>
                <Text style={styles.loginText}>
                  Already have an account?
                  <Text style={styles.loginTextNav}> Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9AA793',
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  signUpButton: {
    backgroundColor: '#E6D29C',
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
  },
  loginTextNav: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
