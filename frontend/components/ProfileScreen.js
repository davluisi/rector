import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Dimensions, Keyboard, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { config } from '../config';
import ArchivioScreen from './ArchivioScreen';
import AdminScreen from './AdminScreen';
import AdminSpecializzazioniScreen from './AdminSpecializzazioniScreen';
import PtSpecializzazioniScreen from './PtSpecializzazioniScreen';

const getApiUrl = () => config.apiUrl;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatBirthDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const calculateAge = (birthDateStr) => {
  if (!birthDateStr) return 'N/D';
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return 'N/D';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} anni`;
};

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
  const [currentScreen, setCurrentScreen] = useState('view'); // 'view' | 'impostazioni' | 'account' | 'edit' | 'password' | 'archivio' | 'specializzazioni' | 'admin' | 'admin_specializzazioni'
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Stati per modale attivazione/disattivazione profilo atleta
  const [showAtletaModal, setShowAtletaModal] = useState(false);
  const [isTogglingAtleta, setIsTogglingAtleta] = useState(false);
  const [atletaModalError, setAtletaModalError] = useState('');

  // Sotto-tab selezionato per AdminScreen ('stats' | 'verifiche')
  const [adminInitialTab, setAdminInitialTab] = useState('stats');

  // Form states for Editing
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altezza, setAltezza] = useState('');
  const [selectedGender, setSelectedGender] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [dataNascita, setDataNascita] = useState('');

  const formatDateForEdit = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const parseDate = (dateStr) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dateStr)) return null;
    const match = dateStr.match(regex);
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return null;
    }
    if (year < 1900 || year > new Date().getFullYear()) return null;
    
    const pad = (n) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  };

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

      try {
        setErrorMessage('');
        setSuccessMessage('Caricamento immagine...');

        let uploadData;
        const uploadEndpoint = `${getApiUrl()}/api/files/upload-immagine-profilo`;

        if (Platform.OS !== 'web') {
          const uploadResult = await FileSystem.uploadAsync(uploadEndpoint, uri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            mimeType: type,
            parameters: {}
          });

          try {
            uploadData = JSON.parse(uploadResult.body);
          } catch (e) {
            uploadData = { errore: uploadResult.body };
          }

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(uploadData.errore || "Errore durante il caricamento dell'immagine");
          }
        } else {
          const responseBlob = await fetch(uri);
          const blob = await responseBlob.blob();
          const formData = new FormData();
          formData.append('file', blob, filename);

          const uploadResponse = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
          });
          uploadData = await uploadResponse.json();
          if (!uploadResponse.ok) {
            throw new Error(uploadData.errore || "Errore durante il caricamento dell'immagine");
          }
        }

        const newImageUrl = uploadData.url;
        setSuccessMessage('Salvataggio immagine...');
          
          const saveResponse = await fetch(`${getApiUrl()}/api/auth/aggiorna/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nome: user.nome,
              cognome: user.cognome,
              email: user.email,
              peso: user.peso,
              altezza: user.altezza,
              genere: user.genere,
              urlImmagineProfilo: newImageUrl,
            }),
          });

          const saveData = await saveResponse.json();
          if (saveResponse.ok) {
            setProfileImage(newImageUrl);
            setSuccessMessage('Immagine aggiornata con successo');
            if (onUpdateUser) {
              onUpdateUser(saveData);
            }
          } else {
            setErrorMessage(saveData.errore || 'Errore durante il salvataggio dell\'immagine');
          }
          setTimeout(() => {
            setSuccessMessage('');
            setErrorMessage('');
          }, 2000);
      } catch (error) {
        console.error(error);
        setErrorMessage('Impossibile caricare o salvare l\'immagine sul server');
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
  const impostazioniTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const accountTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const editTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const passwordTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const archivioTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const specializzazioniTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const adminTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const adminSpecializzazioniTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Run transitions when currentScreen changes
  useEffect(() => {
    Keyboard.dismiss();
    let targetView = 0;
    let targetImpostazioni = SCREEN_WIDTH;
    let targetAccount = SCREEN_WIDTH;
    let targetEdit = SCREEN_WIDTH;
    let targetPassword = SCREEN_WIDTH;
    let targetArchivio = SCREEN_WIDTH;
    let targetSpecializzazioni = SCREEN_WIDTH;
    let targetAdmin = SCREEN_WIDTH;
    let targetAdminSpecializzazioni = SCREEN_WIDTH;

    if (currentScreen === 'view') {
      targetView = 0;
      targetImpostazioni = SCREEN_WIDTH;
      targetAccount = SCREEN_WIDTH;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'impostazioni') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = 0;
      targetAccount = SCREEN_WIDTH;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'account') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = -SCREEN_WIDTH;
      targetAccount = 0;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'edit') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = -SCREEN_WIDTH;
      targetAccount = SCREEN_WIDTH;
      targetEdit = 0;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'password') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = -SCREEN_WIDTH;
      targetAccount = -SCREEN_WIDTH;
      targetEdit = -SCREEN_WIDTH;
      targetPassword = 0;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'archivio') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = SCREEN_WIDTH;
      targetAccount = SCREEN_WIDTH;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = 0;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'specializzazioni') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = SCREEN_WIDTH;
      targetAccount = SCREEN_WIDTH;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = 0;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'admin') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = SCREEN_WIDTH;
      targetAccount = SCREEN_WIDTH;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = 0;
      targetAdminSpecializzazioni = SCREEN_WIDTH;
    } else if (currentScreen === 'admin_specializzazioni') {
      targetView = -SCREEN_WIDTH;
      targetImpostazioni = SCREEN_WIDTH;
      targetAccount = SCREEN_WIDTH;
      targetEdit = SCREEN_WIDTH;
      targetPassword = SCREEN_WIDTH;
      targetArchivio = SCREEN_WIDTH;
      targetSpecializzazioni = SCREEN_WIDTH;
      targetAdmin = SCREEN_WIDTH;
      targetAdminSpecializzazioni = 0;
    }

    Animated.parallel([
      Animated.timing(viewTranslateX, {
        toValue: targetView,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(impostazioniTranslateX, {
        toValue: targetImpostazioni,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(accountTranslateX, {
        toValue: targetAccount,
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
      Animated.timing(archivioTranslateX, {
        toValue: targetArchivio,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(specializzazioniTranslateX, {
        toValue: targetSpecializzazioni,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(adminTranslateX, {
        toValue: targetAdmin,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(adminSpecializzazioniTranslateX, {
        toValue: targetAdminSpecializzazioni,
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
      setDataNascita(formatDateForEdit(user.dataNascita));
    }
  }, [user, currentScreen]);



  if (!user) return null;

  const [editingField, setEditingField] = useState(null); // 'nome' | 'cognome' | 'email' | 'genere' | 'peso' | 'altezza'
  const [editingValue, setEditingValue] = useState('');
  const subPageTranslateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Run transition for sub-page sliding
  useEffect(() => {
    if (editingField) {
      Animated.timing(subPageTranslateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [editingField]);

  const getSubPageTitle = () => {
    switch (editingField) {
      case 'nome':
        return 'Modifica nome';
      case 'cognome':
        return 'Modifica cognome';
      case 'email':
        return 'Modifica email';
      case 'dataNascita':
        return 'Modifica data di nascita';
      case 'genere':
        return 'Modifica genere';
      case 'peso':
        return 'Modifica peso';
      case 'altezza':
        return 'Modifica altezza';
      default:
        return 'Modifica';
    }
  };

  const handleCancelSubPage = () => {
    Animated.timing(subPageTranslateX, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setEditingField(null);
      setSubmitted(false);
      setErrorMessage('');
      setSuccessMessage('');
      setIsVerifyingEmailOtp(false);
      setOtpCode('');
    });
  };

  const handleRemoveImage = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('Rimozione immagine...');
      const response = await fetch(`${getApiUrl()}/api/auth/aggiorna/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: user.nome,
          cognome: user.cognome,
          email: user.email,
          peso: user.peso,
          altezza: user.altezza,
          genere: user.genere,
          urlImmagineProfilo: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.errore || 'Errore durante la rimozione dell\'immagine');
        return;
      }

      setProfileImage(null);
      setSuccessMessage('Immagine rimossa');
      if (onUpdateUser) {
        onUpdateUser(data);
      }
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleSaveField = async () => {
    Keyboard.dismiss();
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (editingField === 'nome' && !editingValue.trim()) {
      setErrorMessage('Il nome è obbligatorio');
      return;
    }
    if (editingField === 'cognome' && !editingValue.trim()) {
      setErrorMessage('Il cognome è obbligatorio');
      return;
    }
    if (editingField === 'dataNascita') {
      if (!editingValue.trim()) {
        setErrorMessage('La data di nascita è obbligatoria');
        return;
      }
      const formattedDate = parseDate(editingValue.trim());
      if (!formattedDate) {
        setErrorMessage('Data di nascita non valida (formato GG/MM/AAAA)');
        return;
      }
    }
    if (editingField === 'email') {
      const cleanEmail = editingValue.trim().toLowerCase();
      if (!cleanEmail) {
        setErrorMessage('L\'email è obbligatoria');
        return;
      }
      const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
      if (!emailRegex.test(cleanEmail)) {
        setErrorMessage('Formato email non valido');
        return;
      }

      // If email changed and we haven't started OTP verification yet
      if (cleanEmail !== user.email && !isVerifyingEmailOtp) {
        try {
          setSuccessMessage('Invio codice OTP in corso...');
          const response = await fetch(`${getApiUrl()}/api/auth/invia-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: cleanEmail }),
          });

          const data = await response.json();
          if (!response.ok) {
            setErrorMessage(data.errore || 'Errore durante l\'invio del codice OTP');
            return;
          }

          setSuccessMessage('Codice inviato correttamente!');
          setOtpCode('');
          setSubmitted(false);
          setTimeout(() => {
            setSuccessMessage('');
            setIsVerifyingEmailOtp(true);
          }, 800);
          return;
        } catch (error) {
          setErrorMessage('Impossibile inviare il codice di verifica');
          console.error(error);
          return;
        }
      }
    }

    await executeSaveField();
  };

  const executeSaveField = async () => {
    const formattedDate = editingField === 'dataNascita' ? parseDate(editingValue.trim()) : user.dataNascita;
    const body = {
      nome: editingField === 'nome' ? editingValue.trim() : user.nome,
      cognome: editingField === 'cognome' ? editingValue.trim() : user.cognome,
      email: editingField === 'email' ? editingValue.trim().toLowerCase() : user.email,
      peso: editingField === 'peso' ? (editingValue.trim() ? parseFloat(editingValue.replace(',', '.')) : null) : user.peso,
      altezza: editingField === 'altezza' ? (editingValue.trim() ? parseFloat(editingValue.replace(',', '.')) : null) : user.altezza,
      genere: editingField === 'genere' ? editingValue : user.genere,
      urlImmagineProfilo: user.urlImmagineProfilo,
      dataNascita: formattedDate,
    };

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/aggiorna/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.errore || 'Errore durante il salvataggio');
        return;
      }

      setSuccessMessage('Profilo modificato con successo');
      if (onUpdateUser) {
        onUpdateUser(data);
      }

      if (editingField === 'nome') setNome(data.nome);
      else if (editingField === 'cognome') setCognome(data.cognome);
      else if (editingField === 'email') setEmail(data.email);
      else if (editingField === 'dataNascita') setDataNascita(formatDateForEdit(data.dataNascita));
      else if (editingField === 'peso') setPeso(data.peso ? String(data.peso) : '');
      else if (editingField === 'altezza') setAltezza(data.altezza ? String(data.altezza) : '');
      else if (editingField === 'genere') setSelectedGender(data.genere || null);

      setTimeout(() => {
        handleCancelSubPage();
      }, 1200);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleVerifyEmailOtp = async () => {
    Keyboard.dismiss();
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (otpCode.length < 4) {
      setErrorMessage('Inserisci il codice di 4 cifre');
      return;
    }

    try {
      const cleanEmail = editingValue.trim().toLowerCase();
      const response = await fetch(`${getApiUrl()}/api/auth/verifica-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          codice: otpCode.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.errore || 'Codice errato o scaduto');
        return;
      }

      setSuccessMessage('Email verificata con successo!');
      setSubmitted(false);
      
      // Save to database
      await executeSaveField();
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleResendEmailOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('Rinvio codice OTP...');
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/invia-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: editingValue.trim().toLowerCase() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.errore || 'Errore durante l\'invio del codice OTP');
        return;
      }

      setSuccessMessage('Codice inviato nuovamente!');
      setOtpCode('');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      setErrorMessage('Impossibile inviare il codice di verifica');
      console.error(error);
    }
  };

  const handleSavePassword = async () => {
    Keyboard.dismiss();
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
      const response = await fetch(`${getApiUrl()}/api/auth/cambia-password/${user.id}`, {
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
        setCurrentScreen(previousPasswordScreen || 'edit');
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

  const [previousPasswordScreen, setPreviousPasswordScreen] = useState('edit');

  const handleOpenPassword = (fromScreen = 'edit') => {
    setPreviousPasswordScreen(fromScreen);
    setCurrentScreen('password');
  };

  const handleToggleProfiloAtleta = async () => {
    setIsTogglingAtleta(true);
    setAtletaModalError('');
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/pt/${user.id}/toggle-profilo-atleta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.haAbbonamentoAttivo || data.errore) {
          setAtletaModalError(data.errore || 'Operazione non consentita');
        } else {
          setAtletaModalError('Errore durante l\'aggiornamento del profilo');
        }
        return;
      }

      if (data.user && onUpdateUser) {
        onUpdateUser(data.user);
      }
      setShowAtletaModal(false);
      setAtletaModalError('');
    } catch (err) {
      console.error(err);
      setAtletaModalError('Impossibile connettersi al server');
    } finally {
      setIsTogglingAtleta(false);
    }
  };

  const handleCancel = () => {
    setCurrentScreen('impostazioni');
    setSubmitted(false);
    setModifiedFields({});
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelPassword = () => {
    setCurrentScreen(previousPasswordScreen || 'edit');
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
        {/* Header locale per Area personale */}
        <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
          <View className="w-10" />
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white tracking-tight">Area personale</Text>
          </View>
          <View className="w-10" />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        >
          <View className="mt-2" />

          {/* User Card */}
          <View className="items-center bg-[#16161A]/60 border border-borderDark/40 rounded-3xl p-6 mb-6">
            <View className="w-24 h-24 rounded-full bg-[#1E1E24] justify-center items-center overflow-hidden mb-4 shadow-lg shadow-black/40">
              {user.urlImmagineProfilo ? (
                <Image source={{ uri: user.urlImmagineProfilo }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={48} color="#A1A1AA" />
              )}
            </View>
            <View className="flex-row items-center justify-center flex-wrap gap-1.5">
              <Text className="text-white text-xl font-bold">{user.nome} {user.cognome}</Text>
              {(user.admin || user.isAdmin) && (
                <Text className="text-[#FFB430] text-sm font-semibold">(admin)</Text>
              )}
            </View>
          </View>

          {/* Personal Trainer Archive Button */}
          {(user.ruolo === 'pt' || user.ruolo === 'PERSONAL_TRAINER' || user.ruolo === 'entrambi') && (
            <>
              <TouchableOpacity 
                className="bg-[#FEB32F]/15 border border-[#FEB32F]/40 h-12 rounded-xl justify-center items-center flex-row gap-2 mb-3 shadow-sm"
                activeOpacity={0.7}
                onPress={() => setCurrentScreen('archivio')}
              >
                <Ionicons name="folder-open" size={18} color="#FEB32F" />
                <Text className="text-[#FEB32F] text-[15px] font-bold">Archivio Esercizi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-[#FEB32F]/10 border border-[#FEB32F]/30 h-12 rounded-xl justify-center items-center flex-row gap-2 mb-3 shadow-sm"
                activeOpacity={0.7}
                onPress={() => setCurrentScreen('specializzazioni')}
              >
                <Ionicons name="ribbon-outline" size={18} color="#FEB32F" />
                <Text className="text-[#FEB32F] text-[15px] font-bold">Specializzazioni</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Admin Buttons: Statistiche, Personal Trainer e Specializzazioni */}
          {(user.admin || user.isAdmin) && (
            <>
              <TouchableOpacity 
                className="bg-[#FFB430]/15 border border-[#FFB430]/40 h-12 rounded-xl justify-center items-center flex-row gap-2 mb-3 shadow-sm"
                activeOpacity={0.7}
                onPress={() => {
                  setAdminInitialTab('stats');
                  setCurrentScreen('admin');
                }}
              >
                <Ionicons name="bar-chart-outline" size={18} color="#FFB430" />
                <Text className="text-[#FFB430] text-[15px] font-bold">Statistiche</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-[#FFB430]/15 border border-[#FFB430]/40 h-12 rounded-xl justify-center items-center flex-row gap-2 mb-3 shadow-sm"
                activeOpacity={0.7}
                onPress={() => {
                  setAdminInitialTab('verifiche');
                  setCurrentScreen('admin');
                }}
              >
                <Ionicons name="people-outline" size={18} color="#FFB430" />
                <Text className="text-[#FFB430] text-[15px] font-bold">Personal Trainer</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-[#FFB430]/15 border border-[#FFB430]/40 h-12 rounded-xl justify-center items-center flex-row gap-2 mb-3 shadow-sm"
                activeOpacity={0.7}
                onPress={() => setCurrentScreen('admin_specializzazioni')}
              >
                <Ionicons name="ribbon-outline" size={18} color="#FFB430" />
                <Text className="text-[#FFB430] text-[15px] font-bold">Specializzazioni</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Tasto Impostazioni (per tutti gli utenti: Atleta, PT, entrambi) */}
          <TouchableOpacity 
            className="bg-inputDark border border-inputBorder h-12 rounded-xl justify-center items-center flex-row gap-2 mb-3"
            activeOpacity={0.7}
            onPress={() => setCurrentScreen('impostazioni')}
          >
            <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
            <Text className="text-zinc-300 text-[15px] font-bold">Impostazioni</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            className="bg-accentPink/10 border border-accentPink/20 h-12 rounded-xl justify-center items-center flex-row gap-2"
            activeOpacity={0.8}
            onPress={() => setShowLogoutConfirmModal(true)}
          >
            <Ionicons name="log-out" size={18} color="#A0132C" />
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
        {/* Header locale per Profilo */}
        <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
          <View className="w-10 items-start">
            <TouchableOpacity onPress={handleCancel} className="p-1">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white tracking-tight">Profilo</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-2" />



          {/* Profile Picture (Centered with Remove button below it) */}
          <View className="items-center justify-center mb-8 w-full gap-3">
            <TouchableOpacity 
              className="w-24 h-24 rounded-full bg-inputDark border border-inputBorder justify-center items-center overflow-hidden shadow-lg shadow-black/30"
              activeOpacity={0.8}
              onPress={handlePickImage}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} className="w-full h-full" />
              ) : (
                <View className="items-center justify-center">
                  <Ionicons name="camera-outline" size={32} color="#A1A1AA" />
                </View>
              )}
            </TouchableOpacity>

            {profileImage && (
              <TouchableOpacity 
                onPress={handleRemoveImage}
                className="bg-accentPink/10 border border-accentPink/20 py-1.5 px-4 rounded-xl mt-1"
                activeOpacity={0.8}
              >
                <Text className="text-accentPink text-xs font-bold">Rimuovi immagine</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Clickable Fields List */}
          <View className="w-full gap-3.5 mb-6">
            {/* Nome */}
            <TouchableOpacity 
              onPress={() => { setEditingField('nome'); setEditingValue(nome); }} 
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Nome</Text>
              <Text className="text-white text-base font-semibold mt-1.5">{nome || 'N/D'}</Text>
            </TouchableOpacity>

            {/* Cognome */}
            <TouchableOpacity 
              onPress={() => { setEditingField('cognome'); setEditingValue(cognome); }} 
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cognome</Text>
              <Text className="text-white text-base font-semibold mt-1.5">{cognome || 'N/D'}</Text>
            </TouchableOpacity>

            {/* Data di nascita */}
            <TouchableOpacity 
              onPress={() => { setEditingField('dataNascita'); setEditingValue(dataNascita); }} 
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Data di nascita</Text>
              <Text className="text-white text-base font-semibold mt-1.5">{dataNascita || 'N/D'}</Text>
            </TouchableOpacity>

            {/* Genere */}
            <TouchableOpacity 
              onPress={() => { setEditingField('genere'); setEditingValue(selectedGender); }} 
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Genere</Text>
              <Text className="text-white text-base font-semibold mt-1.5 capitalize">
                {selectedGender ? selectedGender.toLowerCase() : 'N/D'}
              </Text>
            </TouchableOpacity>

            {/* Peso (Only for Atleta) */}
            {(user.ruolo === 'utente_atleta' || user.ruolo === 'entrambi') && (
              <TouchableOpacity 
                onPress={() => { setEditingField('peso'); setEditingValue(peso); }} 
                className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Peso</Text>
                <Text className="text-white text-base font-semibold mt-1.5">{peso ? `${peso} kg` : 'N/D'}</Text>
              </TouchableOpacity>
            )}

            {/* Altezza (Only for Atleta) */}
            {(user.ruolo === 'utente_atleta' || user.ruolo === 'entrambi') && (
              <TouchableOpacity 
                onPress={() => { setEditingField('altezza'); setEditingValue(altezza); }} 
                className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Altezza</Text>
                <Text className="text-white text-base font-semibold mt-1.5">{altezza ? `${altezza} cm` : 'N/D'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
        {/* Header locale per Cambia password */}
        <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
          <View className="w-10 items-start">
            <TouchableOpacity onPress={handleCancelPassword} className="p-1">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white tracking-tight">Modifica password</Text>
          </View>
          <View className="w-10" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mt-2" />
            {/* Space reserved for Error/Success Message banner to prevent layout shifts */}
            <View className="h-[52px] mb-6 w-full justify-center items-start">
              {errorMessage && currentScreen === 'password' ? (
                <View className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl self-start">
                  <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
                </View>
              ) : successMessage && currentScreen === 'password' ? (
                <View className="bg-accentCyan/10 border border-accentCyan/20 px-4 py-2.5 rounded-xl self-start">
                  <Text className="text-accentCyan text-xs font-semibold">{successMessage}</Text>
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

              <TouchableOpacity 
                className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5" 
                activeOpacity={0.8}
                onPress={handleSavePassword}
              >
                <Text className="text-zinc-950 text-[15px] font-bold">Salva Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* 4. ARCHIVIO SCREEN (Personal Trainer) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: archivioTranslateX }],
        }}
      >
        <ArchivioScreen
          user={user}
          onBack={() => setCurrentScreen('view')}
        />
      </Animated.View>

      {/* 4b. SPECIALIZZAZIONI SCREEN (Personal Trainer) */}
      {(user.ruolo === 'pt' || user.ruolo === 'PERSONAL_TRAINER' || user.ruolo === 'entrambi') && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: specializzazioniTranslateX }],
          }}
        >
          <PtSpecializzazioniScreen
            user={user}
            onBack={() => setCurrentScreen('view')}
            onUpdateUser={onUpdateUser}
          />
        </Animated.View>
      )}

      {/* 1b. IMPOSTAZIONI SCREEN (Disponibile per tutti gli utenti) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: impostazioniTranslateX }],
        }}
      >
        {/* Header locale per Impostazioni */}
        <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
          <View className="w-10 items-start">
            <TouchableOpacity onPress={() => setCurrentScreen('view')} className="p-1">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white tracking-tight">Impostazioni</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        >
          <View className="mt-2" />

          <View className="w-full gap-3.5 mb-6">
            {/* Voce Profilo */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('edit')}
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#202026] justify-center items-center border border-borderDark/60">
                  <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white text-base font-semibold">Profilo</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Dati personali</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Voce Account */}
            <TouchableOpacity
              onPress={() => setCurrentScreen('account')}
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#202026] justify-center items-center border border-borderDark/60">
                  <Ionicons name="shield-outline" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white text-base font-semibold">Account</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {(user.ruolo === 'pt' || user.ruolo === 'PERSONAL_TRAINER' || user.ruolo === 'entrambi')
                      ? 'Email, password e profilo atleta'
                      : 'Email e password'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* 1c. ACCOUNT SCREEN (Email e Password per tutti, Profilo da Atleta per PT) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: accountTranslateX }],
        }}
      >
        {/* Header locale per Account */}
        <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
          <View className="w-10 items-start">
            <TouchableOpacity onPress={() => setCurrentScreen('impostazioni')} className="p-1">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-white tracking-tight">Account</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        >
          <View className="mt-2" />

          {/* Credenziali di accesso */}
          <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Credenziali di accesso</Text>
          <View className="w-full gap-3.5 mb-6">
            {/* Email */}
            <TouchableOpacity 
              onPress={() => { setEditingField('email'); setEditingValue(email); }} 
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Email</Text>
              <Text className="text-white text-base font-semibold mt-1.5">{email || 'N/D'}</Text>
            </TouchableOpacity>

            {/* Password */}
            <TouchableOpacity 
              onPress={() => handleOpenPassword('account')} 
              className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-col justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Password</Text>
              <Text className="text-white text-base font-semibold mt-1.5">••••••••</Text>
            </TouchableOpacity>
          </View>

          {/* Profilo da Atleta (solo per chi è PT / entrambi) */}
          {(user.ruolo === 'pt' || user.ruolo === 'PERSONAL_TRAINER' || user.ruolo === 'entrambi') && (
            <>
              <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Profilo da atleta</Text>
              <View className="w-full bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-5 mb-6">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 rounded-xl bg-accentCyan/10 border border-accentCyan/20 justify-center items-center">
                    <Ionicons name="barbell-outline" size={20} color="#00F0FF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      {user.ruolo === 'entrambi' ? 'Attivo' : 'Non attivo'}
                    </Text>
                    <Text className="text-zinc-400 text-xs mt-0.5">
                      {user.ruolo === 'entrambi'
                        ? 'Puoi ricevere piani di allenamento da altri personal trainer.'
                        : 'Attiva il profilo da atleta per farti seguire da altri personal trainer.'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className={`h-12 rounded-xl justify-center items-center flex-row gap-2 mt-2 ${
                    user.ruolo === 'entrambi'
                      ? 'bg-accentPink/10 border border-accentPink/30'
                      : 'bg-accentCyan/15 border border-accentCyan/40'
                  }`}
                  activeOpacity={0.8}
                  onPress={() => {
                    setAtletaModalError('');
                    setShowAtletaModal(true);
                  }}
                >
                  <Ionicons
                    name={user.ruolo === 'entrambi' ? 'close-circle-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={user.ruolo === 'entrambi' ? '#A0132C' : '#00F0FF'}
                  />
                  <Text
                    className={`text-[15px] font-bold ${
                      user.ruolo === 'entrambi' ? 'text-accentPink' : 'text-accentCyan'
                    }`}
                  >
                    {user.ruolo === 'entrambi' ? 'Disattiva' : 'Attiva'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* 5. ADMIN SCREEN */}
      {(user.admin || user.isAdmin) && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: adminTranslateX }],
          }}
        >
          <AdminScreen
            user={user}
            initialTab={adminInitialTab}
            onBack={() => setCurrentScreen('view')}
          />
        </Animated.View>
      )}

      {/* 5b. ADMIN SPECIALIZZAZIONI SCREEN */}
      {(user.admin || user.isAdmin) && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: adminSpecializzazioniTranslateX }],
          }}
        >
          <AdminSpecializzazioniScreen
            user={user}
            onBack={() => setCurrentScreen('view')}
          />
        </Animated.View>
      )}

      {/* MODALE ATTIVAZIONE / DISATTIVAZIONE PROFILO ATLETA */}
      <Modal
        visible={showAtletaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isTogglingAtleta) {
            setShowAtletaModal(false);
            setAtletaModalError('');
          }
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <View className="w-full max-w-sm bg-[#16161A] border border-[#282832] rounded-3xl p-6 items-center shadow-2xl">
            <View className={`w-14 h-14 rounded-2xl justify-center items-center mb-4 ${
              atletaModalError
                ? 'bg-red-500/10 border border-red-500/20'
                : user.ruolo === 'entrambi'
                ? 'bg-accentPink/10 border border-accentPink/20'
                : 'bg-accentCyan/10 border border-accentCyan/20'
            }`}>
              <Ionicons
                name={
                  atletaModalError
                    ? 'alert-circle-outline'
                    : user.ruolo === 'entrambi'
                    ? 'information-circle-outline'
                    : 'barbell-outline'
                }
                size={28}
                color={
                  atletaModalError
                    ? '#EF4444'
                    : user.ruolo === 'entrambi'
                    ? '#A0132C'
                    : '#00F0FF'
                }
              />
            </View>

            <Text className="text-white text-lg font-bold text-center">
              {atletaModalError
                ? 'Attenzione'
                : user.ruolo === 'entrambi'
                ? 'Disattiva profilo da atleta'
                : 'Attiva profilo da atleta'}
            </Text>

            <Text className="text-zinc-300 text-sm text-center mt-3 leading-relaxed">
              {atletaModalError ? (
                atletaModalError
              ) : user.ruolo === 'entrambi' ? (
                'Disattivando il profilo da atleta perderai la possibilità di ricevere piani di allenamento da altri personal trainer, potrai comunque riattivarlo in qualsiasi momento.'
              ) : (
                'Attivando il profilo da atleta potrai usufruire di tutte le funzioni dell\'app. Potrai utilizzarla sia come personal trainer sia come utente generico (atleta) direttamente dallo stesso account.'
              )}
            </Text>

            {/* Pulsanti modale */}
            {atletaModalError ? (
              <View className="w-full mt-6">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowAtletaModal(false);
                    setAtletaModalError('');
                  }}
                  className="w-full h-12 rounded-xl bg-[#202026] border border-[#2D2D38] justify-center items-center"
                >
                  <Text className="text-white font-semibold text-sm">Chiudi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3 w-full mt-6">
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={isTogglingAtleta}
                  onPress={() => {
                    setShowAtletaModal(false);
                    setAtletaModalError('');
                  }}
                  className="flex-1 h-12 rounded-xl bg-[#202026] border border-[#2D2D38] justify-center items-center"
                >
                  <Text className="text-zinc-300 font-semibold text-sm">Annulla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isTogglingAtleta}
                  onPress={handleToggleProfiloAtleta}
                  className={`flex-1 h-12 rounded-xl justify-center items-center ${
                    user.ruolo === 'entrambi'
                      ? 'bg-accentPink shadow-md shadow-accentPink/20'
                      : 'bg-white shadow-md shadow-white/10'
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      user.ruolo === 'entrambi' ? 'text-white' : 'text-zinc-950'
                    }`}
                  >
                    {isTogglingAtleta ? 'Attendi...' : 'Conferma'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DI CONFERMA LOGOUT */}
      <Modal
        visible={showLogoutConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirmModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <View className="w-full max-w-sm bg-[#16161A] border border-[#282832] rounded-3xl p-6 items-center shadow-2xl">
            <View className="w-14 h-14 rounded-2xl bg-accentPink/10 border border-accentPink/20 justify-center items-center mb-4">
              <Ionicons name="log-out-outline" size={28} color="#A0132C" />
            </View>

            <Text className="text-white text-lg font-bold text-center">
              Vuoi uscire dall'account?
            </Text>
            <Text className="text-zinc-400 text-xs text-center mt-1.5 leading-relaxed">
              Dovrai effettuare nuovamente l'accesso per visualizzare i tuoi dati e le tue schede.
            </Text>

            <View className="flex-row gap-3 w-full mt-6">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowLogoutConfirmModal(false)}
                className="flex-1 h-12 rounded-xl bg-[#202026] border border-[#2D2D38] justify-center items-center"
              >
                <Text className="text-zinc-300 font-semibold text-sm">Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowLogoutConfirmModal(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 h-12 rounded-xl bg-accentPink justify-center items-center shadow-md shadow-accentPink/20"
              >
                <Text className="text-white font-bold text-sm">Esci</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUB-PAGE OVERLAY FOR SINGLE FIELD EDITING (Condiviso tra Profilo e Account) */}
      {editingField && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: subPageTranslateX }],
            backgroundColor: '#0D0D11',
            zIndex: 100,
          }}
        >
          {/* Header locale per Sub-page dinamico */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10 items-start">
              <TouchableOpacity onPress={handleCancelSubPage} className="p-1">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">{getSubPageTitle()}</Text>
            </View>
            <View className="w-10" />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="mt-2" />

              {/* Space reserved for Error/Success Message banner */}
              <View className="h-[52px] mb-6 w-full justify-center items-start">
                {errorMessage && (currentScreen === 'edit' || currentScreen === 'account') && editingField ? (
                  <View className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl self-start">
                    <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
                  </View>
                ) : successMessage && (currentScreen === 'edit' || currentScreen === 'account') && editingField ? (
                  <View className="bg-accentCyan/10 border border-accentCyan/20 px-4 py-2.5 rounded-xl self-start">
                    <Text className="text-accentCyan text-xs font-semibold">{successMessage}</Text>
                  </View>
                ) : null}
              </View>

              {/* Render input depending on the editing field */}
              {editingField === 'nome' && (
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nome</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                    value={editingValue}
                    onChangeText={setEditingValue}
                    autoCapitalize="words"
                    scrollEnabled={false}
                    autoFocus
                  />
                </View>
              )}

              {editingField === 'cognome' && (
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Cognome</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                    value={editingValue}
                    onChangeText={setEditingValue}
                    autoCapitalize="words"
                    scrollEnabled={false}
                    autoFocus
                  />
                </View>
              )}

              {editingField === 'email' && (
                isVerifyingEmailOtp ? (
                  <View className="w-full">
                    <Text className="text-zinc-400 text-sm mb-6 text-center leading-relaxed">
                      Abbiamo inviato un codice OTP di 4 cifre alla nuova email:{"\n"}
                      <Text className="text-white font-bold">{editingValue.trim().toLowerCase()}</Text>
                    </Text>

                    {/* OTP Input */}
                    <View className="mb-6 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Codice di verifica</Text>
                      <TextInput
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-lg font-bold text-center tracking-[10px] focus:border-accentCyan ${
                          submitted && !otpCode.trim() ? 'border-red-500' : 'border-inputBorder'
                        }`}
                        value={otpCode}
                        onChangeText={(val) => setOtpCode(val.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0000"
                        placeholderTextColor="#52525B"
                        scrollEnabled={false}
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity 
                      className="border border-borderDark h-12 rounded-xl justify-center items-center mb-2" 
                      activeOpacity={0.8}
                      onPress={handleResendEmailOtp}
                    >
                      <Text className="text-zinc-400 text-sm font-bold">Invia di nuovo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="mb-6 w-full">
                    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                    <TextInput
                      className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                      value={editingValue}
                      onChangeText={setEditingValue}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      scrollEnabled={false}
                      autoFocus
                    />
                  </View>
                )
              )}

              {editingField === 'dataNascita' && (
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Data di nascita (GG/MM/AAAA)</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                    value={editingValue}
                    onChangeText={(text) => {
                      let formatted = text.replace(/[^0-9]/g, '');
                      if (formatted.length > 2) {
                        formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
                      }
                      if (formatted.length > 5) {
                        formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
                      }
                      setEditingValue(formatted);
                    }}
                    placeholder="GG/MM/AAAA"
                    placeholderTextColor="#52525B"
                    keyboardType="number-pad"
                    maxLength={10}
                    scrollEnabled={false}
                    autoFocus
                  />
                </View>
              )}

              {editingField === 'peso' && (
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Peso (kg)</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                    value={editingValue}
                    onChangeText={setEditingValue}
                    keyboardType="decimal-pad"
                    scrollEnabled={false}
                    autoFocus
                  />
                </View>
              )}

              {editingField === 'altezza' && (
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Altezza (cm)</Text>
                  <TextInput
                    className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                    value={editingValue}
                    onChangeText={setEditingValue}
                    keyboardType="numeric"
                    scrollEnabled={false}
                    autoFocus
                  />
                </View>
              )}

              {editingField === 'genere' && (
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Genere</Text>
                  <View className="flex-row justify-between gap-3">
                    {['MASCHIO', 'FEMMINA', 'ALTRO'].map((g) => {
                      const label = g === 'MASCHIO' ? 'Maschio' : g === 'FEMMINA' ? 'Femmina' : 'Altro';
                      const isSelected = editingValue === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setEditingValue(isSelected ? null : g)}
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
              )}

              {/* Save Button for Sub-page */}
              <TouchableOpacity 
                className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5" 
                activeOpacity={0.8}
                onPress={isVerifyingEmailOtp ? handleVerifyEmailOtp : handleSaveField}
              >
                <Text className="text-zinc-950 text-[15px] font-bold">
                  {isVerifyingEmailOtp ? 'Verifica e Salva' : 'Salva'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

    </View>
  );
}
