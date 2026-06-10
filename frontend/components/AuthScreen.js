import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Local network backend URL (Expo compatible)
const API_URL = 'http://192.168.1.180:8080';
export default function AuthScreen({ visible, onClose, mode, setMode, onLoginSuccess }) {

  // Form inputs states (Registration)
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altezza, setAltezza] = useState('');
  const [selectedGender, setSelectedGender] = useState(null); // 'MASCHIO' | 'FEMMINA' | 'ALTRO'
  const [profileImage, setProfileImage] = useState(null);

  // Form inputs states (Login)
  const [loginEmail, setLoginEmail] = useState('');
  const loginPasswordRef = useRef('');

  // Password refs to prevent immediate masking on re-render
  const passwordRef = useRef('');
  const confirmPasswordRef = useRef('');

  // Validation/Error states
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Clear errors and validation states when switching authentication modes
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitted(false);
  }, [mode]);



  // Reset form helper
  const resetForm = () => {
    setNome('');
    setCognome('');
    setEmail('');
    setPeso('');
    setAltezza('');
    setSelectedGender(null);
    setSubmitted(false);
    setErrorMessage('');
    setSuccessMessage('');
    passwordRef.current = '';
    confirmPasswordRef.current = '';
    setLoginEmail('');
    loginPasswordRef.current = '';
  };

  const handleLogin = async () => {
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    const pwd = loginPasswordRef.current;

    // 1. Check mandatory fields
    if (!loginEmail.trim() || !pwd) {
      setErrorMessage("Inserisci l'email e la password");
      return;
    }

    // 2. Call backend login endpoint
    try {
      const response = await fetch(`${API_URL}/api/auth/accedi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: pwd,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errore) {
          setErrorMessage(data.errore);
        } else {
          setErrorMessage("Errore durante l'accesso");
        }
        return;
      }

      // Success: show message first, then notify App after 1.2 seconds
      setSuccessMessage("Accesso effettuato");
      setTimeout(() => {
        onLoginSuccess(data);
        resetForm();
        onClose();
      }, 1200);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleRegister = async () => {
    setSubmitted(true);
    setErrorMessage('');

    const pwd = passwordRef.current;
    const confirmPwd = confirmPasswordRef.current;

    // 1. Mandatory fields check
    if (!nome.trim() || !cognome.trim() || !email.trim() || !pwd || !confirmPwd) {
      setErrorMessage('Compila tutti i campi obbligatori');
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('formato email non valido');
      return;
    }

    // 3. Passwords match validation
    if (pwd !== confirmPwd) {
      setErrorMessage('le password non coincidono');
      return;
    }

    // 4. Send request to backend
    try {
      const response = await fetch(`${API_URL}/api/auth/registra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          cognome: cognome.trim(),
          email: email.trim().toLowerCase(),
          password: pwd,
          peso: peso.trim() ? parseFloat(peso.replace(',', '.')) : null,
          altezza: altezza.trim() ? parseFloat(altezza.replace(',', '.')) : null,
          genere: selectedGender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errore) {
          setErrorMessage(data.errore);
        } else {
          setErrorMessage('Errore durante la registrazione');
        }
        return;
      }

      // Success: reset form and switch to success screen
      resetForm();
      setMode('success');
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <View 
      pointerEvents={visible ? 'auto' : 'none'}
      className="flex-1 bg-premiumDark"
    >

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Title inside Screen */}
            {mode !== 'success' && (
              <View className="mb-6">
                <Text className="text-3xl font-extrabold text-white tracking-tight">
                  {mode === 'login' && 'Accedi'}
                  {mode === 'register' && 'Registrati'}
                  {mode === 'forgot' && 'Reimposta password'}
                </Text>
              </View>
            )}

            {/* Error Message banner */}
            {errorMessage ? (
              <View className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mb-6 w-full">
                <Text className="text-red-500 text-xs font-semibold text-center">{errorMessage}</Text>
              </View>
            ) : null}

            {/* Success Message banner */}
            {successMessage ? (
              <View className="bg-accentCyan/10 border border-accentCyan/20 p-3.5 rounded-xl mb-6 w-full">
                <Text className="text-accentCyan text-xs font-semibold text-center">{successMessage}</Text>
              </View>
            ) : null}

            {/* Form Content */}
            {mode === 'login' && (
              <View className="w-full">
                {/* Email */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !loginEmail.trim() ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    scrollEnabled={false}
                  />
                </View>

                {/* Password */}
                <View className="mb-4 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Password</Text>
                  <TextInput
                    key={`login_password_${mode}`}
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !loginPasswordRef.current ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    onChangeText={(text) => { loginPasswordRef.current = text; }}
                    secureTextEntry
                    autoCapitalize="none"
                    scrollEnabled={false}
                    autoCorrect={false}
                    textContentType="oneTimeCode"
                  />
                </View>

                <TouchableOpacity onPress={() => setMode('forgot')} className="self-end mb-6">
                  <Text className="text-accentCyan text-sm font-medium">Hai dimenticato la password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5" 
                  activeOpacity={0.8}
                  onPress={handleLogin}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Accedi</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'register' && (
              <View className="w-full relative">
                {/* Foto Profilo (Posizionata sopra il form, a destra del titolo) */}
                <View style={{ position: 'absolute', right: 0, top: -72, zIndex: 10 }}>
                  <TouchableOpacity 
                    className="w-20 h-20 rounded-full bg-inputDark border border-inputBorder justify-center items-center overflow-hidden"
                    activeOpacity={0.8}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} className="w-full h-full" />
                    ) : (
                      <View className="items-center justify-center">
                        <Ionicons name="camera-outline" size={26} color="#A1A1AA" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Nome */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nome</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !nome.trim() ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                    scrollEnabled={false}
                  />
                </View>

                {/* Cognome */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Cognome</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !cognome.trim() ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    value={cognome}
                    onChangeText={setCognome}
                    autoCapitalize="words"
                    scrollEnabled={false}
                  />
                </View>

                {/* Email */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !email.trim() ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    scrollEnabled={false}
                  />
                </View>

                {/* Password */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Password</Text>
                  <TextInput
                    key={`password_${mode}`}
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !passwordRef.current ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    onChangeText={(text) => { passwordRef.current = text; }}
                    secureTextEntry
                    autoCapitalize="none"
                    scrollEnabled={false}
                    autoCorrect={false}
                    textContentType="oneTimeCode"
                  />
                </View>

                {/* Conferma Password */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Conferma Password</Text>
                  <TextInput
                    key={`confirmPassword_${mode}`}
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                      submitted && !confirmPasswordRef.current ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    onChangeText={(text) => { confirmPasswordRef.current = text; }}
                    secureTextEntry
                    autoCapitalize="none"
                    scrollEnabled={false}
                    autoCorrect={false}
                    textContentType="oneTimeCode"
                  />
                </View>
                {/* Blocco Dati Opzionali */}
                <View className="border border-borderDark/50 bg-[#16161A]/40 rounded-2xl p-4 mb-6">
                  <Text className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-4">Informazioni Fisiche (Opzionali)</Text>

                  {/* Peso & Altezza Row */}
                  <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                      <Text className="text-zinc-400 text-xs font-bold tracking-wider mb-2">PESO (kg)</Text>
                      <TextInput
                        className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                        value={peso}
                        onChangeText={setPeso}
                        keyboardType="decimal-pad"
                        scrollEnabled={false}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-zinc-400 text-xs font-bold tracking-wider mb-2">ALTEZZA (cm)</Text>
                      <TextInput
                        className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                        value={altezza}
                        onChangeText={setAltezza}
                        keyboardType="numeric"
                        scrollEnabled={false}
                      />
                    </View>
                  </View>

                  {/* Genere Selection Chips */}
                  <View className="w-full">
                    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Genere</Text>
                    <View className="flex-row justify-between gap-3">
                      {['MASCHIO', 'FEMMINA', 'ALTRO'].map((g) => {
                        const label = g === 'MASCHIO' ? 'Maschio' : g === 'FEMMINA' ? 'Femmina' : 'Altro';
                        const isSelected = selectedGender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setSelectedGender(isSelected ? null : g)}
                            className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                              isSelected ? 'bg-white border-white' : 'bg-inputDark border-inputBorder'
                            }`}
                          >
                            <Text className={`text-xs font-bold ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`}>
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5" 
                  activeOpacity={0.8}
                  onPress={handleRegister}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Crea Account</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'forgot' && (
              <View className="w-full">
                <Text className="text-zinc-400 text-sm leading-6 mb-6">
                  Inserisci l'indirizzo email associato al tuo account.
                </Text>
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5" activeOpacity={0.8}>
                  <Text className="text-zinc-950 text-[15px] font-bold">Invia Link</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('login')} className="flex-row items-center justify-center mt-6">
                  <Ionicons name="arrow-back-outline" size={16} color="#00F0FF" />
                  <Text className="text-accentCyan text-sm font-semibold"> Torna al login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Success screen */}
            {mode === 'success' && (
              <View className="w-full items-center py-6">
                <Ionicons name="checkmark-circle" size={80} color="#00F0FF" className="mb-6" />
                <Text className="text-white text-xl font-bold text-center mb-2">
                  Registrazione avvenuta!
                </Text>
                <Text className="text-zinc-400 text-sm text-center mb-8">
                  Il tuo account è stato creato con successo. Ora puoi effettuare l'accesso.
                </Text>
                <TouchableOpacity 
                  className="bg-white h-12 rounded-xl justify-center items-center w-full shadow-lg shadow-white/5"
                  activeOpacity={0.8}
                  onPress={() => setMode('login')}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Accedi ora</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Toggle Login/Register footer */}
            {mode !== 'forgot' && mode !== 'success' && (
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-zinc-400 text-sm">
                  {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}
                </Text>
                <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                  <Text className="text-white text-sm font-bold ml-1.5 underline">
                    {mode === 'login' ? 'Registrati' : 'Accedi'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Social Login Separator */}
            {mode !== 'forgot' && mode !== 'success' && (
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-borderDark" />
                <Text className="text-zinc-500 text-xs mx-4 font-bold uppercase tracking-wider">Oppure</Text>
                <View className="flex-1 h-[1px] bg-borderDark" />
              </View>
            )}

            {/* Social Login Buttons */}
            {mode !== 'forgot' && mode !== 'success' && (
              <View className="flex-row justify-between gap-4">
                <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1E1E24] border border-[#303038] h-12 rounded-xl gap-2.5" activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                  <Text className="text-white text-sm font-semibold">Google</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1E1E24] border border-[#303038] h-12 rounded-xl gap-2.5" activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text className="text-white text-sm font-semibold">Apple</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}
