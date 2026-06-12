import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'http://192.168.1.180:8080';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Memoized PasswordInput component to guarantee the TextInput does not re-render
// during parent updates, preventing immediate secureTextEntry character masking.
const PasswordInput = React.memo(({ label, error, onChangeText, textKey }) => {
  const [hasText, setHasText] = useState(false);

  useEffect(() => {
    setHasText(false);
  }, [textKey]);

  return (
    <View className="mb-5 w-full">
      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</Text>
      <TextInput
        key={textKey}
        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
          error && !hasText ? 'border-red-500' : 'border-inputBorder'
        }`}
        onChangeText={(text) => {
          setHasText(text.length > 0);
          onChangeText(text);
        }}
        secureTextEntry
        autoCapitalize="none"
        scrollEnabled={false}
        autoCorrect={false}
        textContentType="oneTimeCode"
      />
    </View>
  );
});

export default function ProfileScreen({ user, onLogout, onUpdateUser }) {
  const [currentScreen, setCurrentScreen] = useState('view'); // 'view' | 'edit' | 'password'

  // Form states for Editing
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altezza, setAltezza] = useState('');
  const [selectedGender, setSelectedGender] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permesso per accedere alla galleria negato.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type });

      try {
        setErrorMessage('');
        setSuccessMessage('Caricamento immagine...');
        const uploadResponse = await fetch(`${API_URL}/api/files/upload-immagine-profilo`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const uploadData = await uploadResponse.json();
        if (uploadResponse.ok) {
          setProfileImage(uploadData.url);
          setSuccessMessage('Immagine caricata');
          setTimeout(() => setSuccessMessage(''), 2000);
        } else {
          setErrorMessage(uploadData.errore || 'Errore caricamento immagine');
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Impossibile caricare l\'immagine sul server');
      }
    }
  };

  // Refs and key state for Changing Password to enable resetting uncontrolled inputs
  const passwordAttualeRef = useRef('');
  const nuovaPasswordRef = useRef('');
  const confermaNuovaPasswordRef = useRef('');
  const [submittedPassword, setSubmittedPassword] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const [submitted, setSubmitted] = useState(false);
  const [modifiedFields, setModifiedFields] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Animated offsets for slide transitions
  const viewTranslateX = useRef(new Animated.Value(0)).current;
  const editTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const passwordTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Run transitions when currentScreen changes
  useEffect(() => {
    let targetView = 0;
    let targetEdit = SCREEN_WIDTH;
    let targetPassword = SCREEN_WIDTH;

    if (currentScreen === 'view') {
      targetView = 0;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
    } else if (currentScreen === 'edit') {
      targetView = -SCREEN_WIDTH;
      targetEdit = 0;
      targetPassword = SCREEN_WIDTH;
    } else if (currentScreen === 'password') {
      targetView = -SCREEN_WIDTH;
      targetEdit = -SCREEN_WIDTH;
      targetPassword = 0;
    }

    Animated.parallel([
      Animated.timing(viewTranslateX, {
        toValue: targetView,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(editTranslateX, {
        toValue: targetEdit,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(passwordTranslateX, {
        toValue: targetPassword,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScreen]);

  // Precompile data when screen changes
  useEffect(() => {
    setModifiedFields({});
    if (user) {
      setNome(user.nome || '');
      setCognome(user.cognome || '');
      setEmail(user.email || '');
      setPeso(user.peso ? String(user.peso) : '');
      setAltezza(user.altezza ? String(user.altezza) : '');
      setSelectedGender(user.genere || null);
      setProfileImage(user.urlImmagineProfilo || null);
    }
  }, [user, currentScreen]);

  if (!user) return null;

  const handleSave = async () => {
    setSubmitted(true);
    setModifiedFields({});
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Mandatory fields check
    if (!nome.trim() || !cognome.trim() || !email.trim()) {
      setErrorMessage('Compila tutti i campi obbligatori');
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Formato email non valido');
      return;
    }

    // 3. Send request to backend
    try {
      const response = await fetch(`${API_URL}/api/auth/aggiorna/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          cognome: cognome.trim(),
          email: email.trim().toLowerCase(),
          peso: peso.trim() ? parseFloat(peso.replace(',', '.')) : null,
          altezza: altezza.trim() ? parseFloat(altezza.replace(',', '.')) : null,
          genere: selectedGender,
          urlImmagineProfilo: profileImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errore) {
          setErrorMessage(data.errore);
        } else {
          setErrorMessage('Errore durante il salvataggio');
        }
        return;
      }

      // Success
      setSuccessMessage('Profilo modificato con successo');
      if (onUpdateUser) {
        onUpdateUser(data);
      }
      setTimeout(() => {
        setCurrentScreen('view');
        setSubmitted(false);
        setErrorMessage('');
        setSuccessMessage('');
      }, 1200);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleSavePassword = async () => {
    setSubmittedPassword(true);
    setErrorMessage('');
    setSuccessMessage('');

    const pwdAttuale = passwordAttualeRef.current;
    const pwdNuova = nuovaPasswordRef.current;
    const pwdConferma = confermaNuovaPasswordRef.current;

    if (!pwdAttuale || !pwdNuova || !pwdConferma) {
      setErrorMessage('Compila tutti i campi');
      return;
    }

    if (pwdNuova !== pwdConferma) {
      setErrorMessage('Le password non coincidono');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/cambia-password/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordAttuale: pwdAttuale,
          nuovaPassword: pwdNuova,
          confermaNuovaPassword: pwdConferma,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errore) {
          setErrorMessage(data.errore);
        } else {
          setErrorMessage('Errore durante l\'aggiornamento della password');
        }
        return;
      }

      setSuccessMessage('Password aggiornata con successo');
      setTimeout(() => {
        setCurrentScreen('edit');
        setSubmittedPassword(false);
        setErrorMessage('');
        setSuccessMessage('');
        passwordAttualeRef.current = '';
        nuovaPasswordRef.current = '';
        confermaNuovaPasswordRef.current = '';
        setResetKey(prev => prev + 1); // Force-remount input components to clear their values
      }, 1200);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleCancel = () => {
    setCurrentScreen('view');
    setSubmitted(false);
    setModifiedFields({});
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelPassword = () => {
    setCurrentScreen('edit');
    setSubmittedPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
    passwordAttualeRef.current = '';
    nuovaPasswordRef.current = '';
    confermaNuovaPasswordRef.current = '';
    setResetKey(prev => prev + 1); // Force-remount input components to clear their values
  };

  return (
    <View className="flex-1 bg-premiumDark relative overflow-hidden">
      
      {/* 1. VIEW SCREEN */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: viewTranslateX }],
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        >
          {/* Title */}
          <View className="mb-8">
            <Text className="text-3xl font-extrabold text-white tracking-tight">Profilo</Text>
          </View>

          {/* User Card */}
          <View className="items-center bg-[#16161A]/60 border border-borderDark/40 rounded-3xl p-6 mb-6">
            <View className="w-24 h-24 rounded-full bg-[#1E1E24] border-2 border-white justify-center items-center overflow-hidden mb-4 shadow-lg shadow-white/10">
              {user.urlImmagineProfilo ? (
                <Image source={{ uri: user.urlImmagineProfilo }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={48} color="#A1A1AA" />
              )}
            </View>
            <Text className="text-white text-xl font-bold">{user.nome} {user.cognome}</Text>
            <Text className="text-zinc-400 text-sm mt-1">{user.email}</Text>
          </View>

          {/* Physical Stats Section (Optional) */}
          {(user.peso || user.altezza || user.genere) && (
            <View className="flex-row justify-between gap-3 mb-6">
              {user.peso ? (
                <View style={{ width: (SCREEN_WIDTH - 72) / 3 }} className="bg-[#16161A]/40 border border-borderDark/50 rounded-3xl p-4 items-center h-24 justify-center">
                  <Ionicons name="scale-outline" size={20} color="#FFFFFF" className="mb-1" />
                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Peso</Text>
                  <Text className="text-white text-base font-bold">{user.peso} kg</Text>
                </View>
              ) : (
                <View style={{ width: (SCREEN_WIDTH - 72) / 3 }} />
              )}
              {user.altezza ? (
                <View style={{ width: (SCREEN_WIDTH - 72) / 3 }} className="bg-[#16161A]/40 border border-borderDark/50 rounded-3xl p-4 items-center h-24 justify-center">
                  <Ionicons name="resize-outline" size={20} color="#FFFFFF" className="mb-1" />
                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Altezza</Text>
                  <Text className="text-white text-base font-bold">{user.altezza} cm</Text>
                </View>
              ) : (
                <View style={{ width: (SCREEN_WIDTH - 72) / 3 }} />
              )}
              {user.genere ? (
                <View style={{ width: (SCREEN_WIDTH - 72) / 3 }} className="bg-[#16161A]/40 border border-borderDark/50 rounded-3xl p-4 items-center h-24 justify-center">
                  <Ionicons 
                    name={
                      user.genere === 'MASCHIO' ? 'man-outline' :
                      user.genere === 'FEMMINA' ? 'woman-outline' : 'person-outline'
                    } 
                    size={20} 
                    color={
                      user.genere === 'FEMMINA' ? '#FF2E93' :
                      user.genere === 'MASCHIO' ? '#00F0FF' : '#FFFFFF'
                    } 
                    className="mb-1" 
                  />
                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Genere</Text>
                  <Text className="text-white text-sm font-bold capitalize">
                    {user.genere.toLowerCase()}
                  </Text>
                </View>
              ) : (
                <View style={{ width: (SCREEN_WIDTH - 72) / 3 }} />
              )}
            </View>
          )}

          {/* Account Settings / Actions */}
          <TouchableOpacity 
            className="bg-inputDark border border-inputBorder h-12 rounded-xl justify-center items-center flex-row gap-2 mb-6"
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('edit')}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text className="text-zinc-300 text-[15px] font-bold">Modifica Profilo</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            className="bg-accentPink/10 border border-accentPink/20 h-12 rounded-xl justify-center items-center flex-row gap-2"
            activeOpacity={0.8}
            onPress={onLogout}
          >
            <Ionicons name="log-out" size={18} color="#FF2E93" />
            <Text className="text-accentPink text-[15px] font-bold">Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* 2. EDIT SCREEN */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: editTranslateX }],
        }}
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
            {/* Header Title with Back Button */}
            <View className="mb-6 flex-row items-center gap-2">
              <TouchableOpacity onPress={handleCancel} className="mr-1">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-3xl font-extrabold text-white tracking-tight">
                Modifica profilo
              </Text>
            </View>
            {/* Space reserved for Error/Success Message banner to prevent layout shifts */}
            <View className="h-[52px] mb-6 w-full justify-center items-start">
              {errorMessage && currentScreen === 'edit' ? (
                <View className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl self-start">
                  <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
                </View>
              ) : successMessage && currentScreen === 'edit' ? (
                <View className="bg-accentCyan/10 border border-accentCyan/20 px-4 py-2.5 rounded-xl self-start">
                  <Text className="text-accentCyan text-xs font-semibold">{successMessage}</Text>
                </View>
              ) : null}
            </View>

            {/* Form Content */}
            <View className="w-full relative">
              {/* Foto Profilo (Posizionata sopra il form, a destra del titolo) */}
              <View style={{ position: 'absolute', right: 0, top: -72, zIndex: 10 }}>
                <TouchableOpacity 
                  className="w-20 h-20 rounded-full bg-inputDark border border-inputBorder justify-center items-center overflow-hidden"
                  activeOpacity={0.8}
                  onPress={handlePickImage}
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
              <View className="mb-4 w-full">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nome</Text>
                <TextInput
                  className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                    submitted && !modifiedFields.nome && !nome.trim() ? 'border-red-500' : 'border-inputBorder'
                  }`}
                  value={nome}
                  onChangeText={(text) => {
                    setNome(text);
                    setModifiedFields(prev => ({ ...prev, nome: true }));
                  }}
                  autoCapitalize="words"
                  scrollEnabled={false}
                />
              </View>

              {/* Cognome */}
              <View className="mb-4 w-full">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Cognome</Text>
                <TextInput
                  className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                    submitted && !modifiedFields.cognome && !cognome.trim() ? 'border-red-500' : 'border-inputBorder'
                  }`}
                  value={cognome}
                  onChangeText={(text) => {
                    setCognome(text);
                    setModifiedFields(prev => ({ ...prev, cognome: true }));
                  }}
                  autoCapitalize="words"
                  scrollEnabled={false}
                />
              </View>

              {/* Email */}
              <View className="mb-4 w-full">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                <TextInput
                  className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${
                    (submitted && !modifiedFields.email && (!email.trim() || !/^[A-Za-z0-9+_.-]+@(.+)$/.test(email.trim()))) || (errorMessage === 'Email già in uso' && currentScreen === 'edit' && !modifiedFields.email) ? 'border-red-500' : 'border-inputBorder'
                  }`}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setModifiedFields(prev => ({ ...prev, email: true }));
                    if (errorMessage === 'Email già in uso' && currentScreen === 'edit') {
                      setErrorMessage('');
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  scrollEnabled={false}
                />
              </View>

              {/* Bottone Cambia Password */}
              <View className="mb-4 w-full">
                <TouchableOpacity 
                  onPress={() => setCurrentScreen('password')} 
                  className="bg-[#1E1E24] border border-[#303038] h-12 rounded-xl justify-center items-center flex-row gap-2"
                  activeOpacity={0.8}
                >
                  <Ionicons name="lock-closed-outline" size={18} color="#00F0FF" />
                  <Text className="text-white text-sm font-semibold">Cambia password</Text>
                </TouchableOpacity>
              </View>

              {/* Blocco Dati Opzionali */}
              <View className="border border-borderDark/50 bg-[#16161A]/40 rounded-2xl p-4 mb-4">
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
                onPress={handleSave}
              >
                <Text className="text-zinc-950 text-[15px] font-bold">Salva Modifiche</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* 3. PASSWORD SCREEN */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: passwordTranslateX }],
        }}
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
            {/* Header Title with Back Button */}
            <View className="mb-8 flex-row items-center gap-2">
              <TouchableOpacity onPress={handleCancelPassword} className="mr-1">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-3xl font-extrabold text-white tracking-tight">
                Cambia password
              </Text>
            </View>
            {/* Space reserved for Error Message banner to prevent layout shifts */}
            <View className="h-[52px] mb-6 w-full justify-center items-start">
              {errorMessage && currentScreen === 'password' ? (
                <View className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl self-start">
                  <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
                </View>
              ) : null}
            </View>

            {/* Form Content */}
            <View className="w-full">
              {/* Password Attuale */}
              <PasswordInput
                key={`password_attuale_${resetKey}`}
                label="Password Attuale"
                textKey={`password_attuale_input_${resetKey}`}
                error={submittedPassword && !passwordAttualeRef.current}
                onChangeText={(text) => { passwordAttualeRef.current = text; }}
              />

              {/* Nuova Password */}
              <PasswordInput
                key={`nuova_password_${resetKey}`}
                label="Nuova Password"
                textKey={`nuova_password_input_${resetKey}`}
                error={(submittedPassword && !nuovaPasswordRef.current) || (errorMessage === 'Le password non coincidono' && currentScreen === 'password')}
                onChangeText={(text) => {
                  nuovaPasswordRef.current = text;
                  if (errorMessage === 'Le password non coincidono' && currentScreen === 'password') {
                    setErrorMessage('');
                  }
                }}
              />

              {/* Conferma Nuova Password */}
              <PasswordInput
                key={`conferma_nuova_password_${resetKey}`}
                label="Conferma Nuova Password"
                textKey={`conferma_nuova_password_input_${resetKey}`}
                error={(submittedPassword && !confermaNuovaPasswordRef.current) || (errorMessage === 'Le password non coincidono' && currentScreen === 'password')}
                onChangeText={(text) => {
                  confermaNuovaPasswordRef.current = text;
                  if (errorMessage === 'Le password non coincidono' && currentScreen === 'password') {
                    setErrorMessage('');
                  }
                }}
              />

              {/* Success Message replaces Submit Button to prevent layout shifting */}
              {successMessage && currentScreen === 'password' ? (
                <View className="bg-accentCyan/10 border border-accentCyan/20 h-12 rounded-xl justify-center items-center mt-2 w-full">
                  <Text className="text-accentCyan text-[15px] font-bold text-center">{successMessage}</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5" 
                  activeOpacity={0.8}
                  onPress={handleSavePassword}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Salva Password</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

    </View>
  );
}
