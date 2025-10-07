import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import logo from '../assets/logo.png';
import googleLogo from '../assets/googleLogo.png';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login pressed', { username, password });
  };

  const handleSignUp = () => {
    navigation.navigate('Signup'); // Navigate to Signup screen
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
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
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signUpLink} onPress={handleSignUp}>
              <Text style={styles.signUpText}>
                New to us?
                <Text style={styles.signUpNav}> Sign Up</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.googleSignUpButton}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={googleLogo} style={styles.googleLogo} />
                <Text style={styles.googleSignUpText}>Sign Up with Google</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 30,
    marginTop: -35,
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    backgroundColor: '#E6D29C',
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#fff',
    fontSize: 14,
  },
  signUpNav: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleSignUpButton: {
    backgroundColor: '#6D7E68',
    borderRadius: 30,
    padding: 12,
    marginHorizontal: 60,
    alignItems: 'center',
    marginTop: 18,
    borderColor: '#313830',
  },
  googleLogo: {
    marginRight: 10,
    width: 30,
    height: 30,
  },
  googleSignUpText: {
    color: '#fff',
    fontSize: 14,
  },
});
