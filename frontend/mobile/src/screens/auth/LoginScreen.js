import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { login } from '../../services/authService';
import { COLORS, RADIUS } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        try {
            setLoading(true);
            const data = await login(email.trim(), password);
            await signIn(data.token, data.user);
        } catch (err) {
            Alert.alert('Login Failed', err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={styles.inner}>
            {/* wordmark */}
            <Text style={styles.wordmark}>FlyBy</Text>
            <Text style={styles.tagline}>Track every mile. Own every road.</Text>

            {/* inputs */}
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            {/* // login button */}
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                {loading ? 
                    <ActivityIndicator color="COLORS.white" /> :
                    <Text style={styles.btnText}>Log In</Text>
                }
            </TouchableOpacity>
            {/* // register link */}
            <TouchableOpacity onPress={ () => navigation.navigate('Register') }>
                <Text style={styles.link}>Don't have an account? {' '}
                    <Text style={styles.linkAccent}>Sign Up</Text>
                </Text>
            </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  inner:       { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  wordmark:    { fontSize: 42, fontWeight: '500', color: COLORS.white, letterSpacing: 4, marginBottom: 6 },
  tagline:     { fontSize: 12, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 48 },
  form:        { gap: 12, marginBottom: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
    borderRadius:    RADIUS.md,
    padding:         14,
    fontSize:        14,
    color:           COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.purple,
    borderRadius:    RADIUS.md,
    padding:         15,
    alignItems:      'center',
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: COLORS.white, fontSize: 15, fontWeight: '500', letterSpacing: 0.5 },
  link:        { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  linkAccent:  { color: COLORS.purpleLight },
});