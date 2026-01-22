import { StyleSheet } from 'react-native';

export const profileSettingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8B3A2',
    padding: 20,
    paddingTop: 80,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 18,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Red_Hat_Text-Bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 17,
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#6D7E68',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Red_Hat_Text-SemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
});
