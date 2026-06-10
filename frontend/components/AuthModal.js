import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local network backend URL (Expo compatible)
const API_URL = 'http://192.168.1.180:8080';

export default function AuthModal({ visible, onClose, mode, setMode, onLoginSuccess }) {
  // Common states
  const [selectedGender, setSelectedGender] = useState(null); // 'MASCHIO' | 'FEMMINA' | 'ALTRO'
  const [profileImage, setProfileImage] = useState(null);

  // Form inputs states (Registration)
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altezza, setAltezza] = useState('');

  // Form inputs states (Login)
  const [loginEmail, setLoginEmail] = useState('');
  const loginPasswordRef = useRef('');

  // Password refs to prevent immediate masking on re-render
  const passwordRef = useRef('');
  const confirmPasswordRef = useRef('');

  // Validation/Error states
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear errors and validation states when switching authentication modes
  useEffect(() => {
    setErrorMessage('');
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
    passwordRef.current = '';
    confirmPasswordRef.current = '';
    setLoginEmail('');
    loginPasswordRef.current = '';
  };

  const handleLogin = async () => {
    setSubmitted(true);
    setErrorMessage('');

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

      // Success: notify App, reset and close
      onLoginSuccess(data);
      resetForm();
      onClose();
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
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/75 justify-start items-center p-5 pt-16">
        <KeyboardAvoidingView
          behavior={undefined}
          className="w-full max-w-[400px] items-center"
        >
          <View className="bg-cardDark rounded-[24px] border border-borderDark p-6 w-full shadow-2xl">
            {/* Header inside Card */}
            {mode !== 'success' && (
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-2xl font-extrabold text-white">
                  {mode === 'login' && 'Accedi'}
                  {mode === 'register' && 'Registrati'}
                  {mode === 'forgot' && 'Recupera Password'}
                </Text>
                <TouchableOpacity onPress={handleClose} className="p-1">
                  <Ionicons name="close-circle-outline" size={26} color="#A1A1AA" />
                </TouchableOpacity>
              </View>
            )}

            {/* Error Message banner */}
            {errorMessage ? (
              <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4 w-full">
                <Text className="text-red-500 text-xs font-semibold text-center">{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Content */}
            {mode === 'login' && (
              <View className="w-full">
                {/* Email */}
                <View className="mb-4 w-full">
                  <Text className="text-zinc-400 text-xs font-semibold mb-1.5">email</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
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
                  <Text className="text-zinc-400 text-xs font-semibold mb-1.5">password</Text>
                  <TextInput
                    key={`login_password_${mode}`}
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
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

                <TouchableOpacity onPress={() => setMode('forgot')} className="self-end mb-5">
                  <Text className="text-accentCyan text-[13px] font-medium">Hai dimenticato la password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="bg-accentPink h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-accentPink/30" 
                  activeOpacity={0.8}
                  onPress={handleLogin}
                >
                  <Text className="text-white text-[15px] font-bold">Accedi</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'register' && (
              <View className="w-full">
                <ScrollView className="max-h-[380px] w-full mb-4" showsVerticalScrollIndicator={false}>
                  
                  {/* Profile Picture UI Picker (mocked) */}
                  <View className="items-center mb-5">
                    <TouchableOpacity 
                      className="w-20 h-20 rounded-full bg-inputDark border border-inputBorder justify-center items-center overflow-hidden"
                      activeOpacity={0.8}
                    >
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} className="w-full h-full" />
                      ) : (
                        <View className="items-center justify-center">
                          <Ionicons name="camera-outline" size={26} color="#A1A1AA" />
                          <Text className="text-[10px] text-zinc-500 font-semibold mt-1">Aggiungi</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text className="text-zinc-500 text-[11px] mt-1.5 font-medium">immagine profilo (opzionale)</Text>
                  </View>

                  {/* Nome */}
                  <View className="mb-4 w-full">
                    <Text className="text-zinc-400 text-xs font-semibold mb-1.5">nome</Text>
                    <TextInput
                      className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
                        submitted && !nome.trim() ? 'border-red-500' : 'border-inputBorder'
                      }`}
                      value={nome}
                      onChangeText={setNome}
                      autoCapitalize="words"
                      scrollEnabled={false}
                    />
                  </View>

                  {/* Cognome */}
                  <View className="mb-4 w-full">
                    <Text className="text-zinc-400 text-xs font-semibold mb-1.5">cognome</Text>
                    <TextInput
                      className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
                        submitted && !cognome.trim() ? 'border-red-500' : 'border-inputBorder'
                      }`}
                      value={cognome}
                      onChangeText={setCognome}
                      autoCapitalize="words"
                      scrollEnabled={false}
                    />
                  </View>

                  {/* Email */}
                  <View className="mb-4 w-full">
                    <Text className="text-zinc-400 text-xs font-semibold mb-1.5">email</Text>
                    <TextInput
                      className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
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
                  <View className="mb-4 w-full">
                    <Text className="text-zinc-400 text-xs font-semibold mb-1.5">password</Text>
                    <TextInput
                      key={`password_${mode}`}
                      className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
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
                  <View className="mb-4 w-full">
                    <Text className="text-zinc-400 text-xs font-semibold mb-1.5">conferma password</Text>
                    <TextInput
                      key={`confirmPassword_${mode}`}
                      className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] ${
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

                  {/* Peso & Altezza Row */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-zinc-400 text-xs font-semibold mb-1.5">peso (kg) (opzionale)</Text>
                      <TextInput
                        className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px]"
                        value={peso}
                        onChangeText={setPeso}
                        keyboardType="decimal-pad"
                        scrollEnabled={false}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-zinc-400 text-xs font-semibold mb-1.5">altezza (cm) (opzionale)</Text>
                      <TextInput
                        className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px]"
                        value={altezza}
                        onChangeText={setAltezza}
                        keyboardType="numeric"
                        scrollEnabled={false}
                      />
                    </View>
                  </View>

                  {/* Genere Selection Chips */}
                  <View className="mb-4 w-full">
                    <Text className="text-zinc-400 text-xs font-semibold mb-2">genere (opzionale)</Text>
                    <View className="flex-row justify-between gap-2">
                      {['MASCHIO', 'FEMMINA', 'ALTRO'].map((g) => {
                        const label = g === 'MASCHIO' ? 'Maschio' : g === 'FEMMINA' ? 'Femmina' : 'Altro';
                        const isSelected = selectedGender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setSelectedGender(isSelected ? null : g)}
                            className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                              isSelected ? 'bg-accentCyan border-accentCyan' : 'bg-inputDark border-inputBorder'
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

                </ScrollView>

                <TouchableOpacity 
                  className="bg-accentPink h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-accentPink/30" 
                  activeOpacity={0.8}
                  onPress={handleRegister}
                >
                  <Text className="text-white text-[15px] font-bold">Crea Account</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'forgot' && (
              <View className="w-full">
                <Text className="text-zinc-400 text-sm leading-5 mb-5">
                  Inserisci l'indirizzo email associato al tuo account. Ti invieremo un link per reimpostare la tua password.
                </Text>
                <View className="mb-4 w-full">
                  <Text className="text-zinc-400 text-xs font-semibold mb-1.5">email</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px]"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity className="bg-accentPink h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-accentPink/30" activeOpacity={0.8}>
                  <Text className="text-white text-[15px] font-bold">Invia Link</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('login')} className="flex-row items-center justify-center mt-5">
                  <Ionicons name="arrow-back-outline" size={16} color="#00F0FF" />
                  <Text className="text-accentCyan text-sm font-semibold"> Torna al login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Success screen */}
            {mode === 'success' && (
              <View className="w-full items-center py-4">
                <Ionicons name="checkmark-circle-outline" size={64} color="#00F0FF" className="mb-4" />
                <Text className="text-white text-lg font-bold text-center mb-6">
                  Registrazione avvenuta con successo!
                </Text>
                <TouchableOpacity 
                  className="bg-accentPink h-12 rounded-xl justify-center items-center w-full shadow-lg shadow-accentPink/30"
                  activeOpacity={0.8}
                  onPress={() => setMode('login')}
                >
                  <Text className="text-white text-[15px] font-bold">Accedi</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Toggle Login/Register footer */}
            {mode !== 'forgot' && mode !== 'success' && (
              <View className="flex-row justify-center items-center mt-5">
                <Text className="text-zinc-400 text-sm">
                  {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}
                </Text>
                <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                  <Text className="text-accentPink text-sm font-semibold">
                    {mode === 'login' ? ' Registrati' : ' Accedi'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Social Login Separator */}
            {mode !== 'forgot' && mode !== 'success' && (
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-[1px] bg-borderDark" />
                <Text className="text-zinc-500 text-xs mx-3 font-semibold">Oppure continua con</Text>
                <View className="flex-1 h-[1px] bg-borderDark" />
              </View>
            )}

            {/* Social Login Buttons */}
            {mode !== 'forgot' && mode !== 'success' && (
              <View className="flex-row justify-between gap-3">
                <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1E1E24] border border-[#303038] h-11 rounded-xl gap-2" activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                  <Text className="text-white text-sm font-semibold">Google</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1E1E24] border border-[#303038] h-11 rounded-xl gap-2" activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text className="text-white text-sm font-semibold">Apple</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
