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
  StyleSheet,
  Keyboard,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { File as ModernFile, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

import { config } from '../config';

const getApiUrl = () => config.apiUrl;

// Memoized PasswordInput component to prevent character masking issues on re-render
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

export default function AuthScreen({ visible, onClose, mode, setMode, onLoginSuccess }) {

  // Form inputs states (Registration)
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altezza, setAltezza] = useState('');
  const [selectedGender, setSelectedGender] = useState(null); // 'MASCHIO' | 'FEMMINA' | 'ALTRO'
  const [profileImage, setProfileImage] = useState(null);
  const [dataNascita, setDataNascita] = useState(''); // DD/MM/YYYY format
  const [ruolo, setRuolo] = useState('ATLETA'); // 'ATLETA' | 'PERSONAL_TRAINER'
  const [otpCode, setOtpCode] = useState('');

  // Personal Trainer verification documents states
  const [docFronte, setDocFronte] = useState(null);
  const [docFronteKey, setDocFronteKey] = useState('');
  const [docRetro, setDocRetro] = useState(null);
  const [docRetroKey, setDocRetroKey] = useState('');
  const [scadenzaDocumento, setScadenzaDocumento] = useState('');
  const [certificazioni, setCertificazioni] = useState([]);
  const [certificazioniKeys, setCertificazioniKeys] = useState('');

  // Preview Modal state for images
  const [previewModal, setPreviewModal] = useState({ visible: false, uri: null, name: '' });

  const initialScreen = mode === 'register' ? 'reg1' : (mode === 'forgot' ? 'forgot' : (mode === 'success' ? 'success' : 'login'));
  const [currentScreen, setCurrentScreen] = useState(initialScreen);

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
      setProfileImage(result.assets[0].uri);
    }
  };

  const handlePickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        let finalUri = asset.uri;
        try {
          const fileExt = asset.name ? asset.name.split('.').pop() : 'tmp';
          const safeName = `pt_doc_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
          const destFile = new ModernFile(Paths.document, safeName);
          const srcFile = new ModernFile(asset.uri);
          const bytes = await srcFile.bytes();
          destFile.write(bytes);
          finalUri = destFile.uri;
        } catch (copyErr) {
          console.log('[AuthScreen] Local save failed, using source uri:', copyErr);
        }

        const fileObj = {
          uri: finalUri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
        };

        if (type === 'fronte') {
          setDocFronte(fileObj);
        } else if (type === 'retro') {
          setDocRetro(fileObj);
        } else if (type === 'certificazioni') {
          setCertificazioni(prev => [...prev, fileObj]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleViewFile = async (fileObj) => {
    if (!fileObj || !fileObj.uri) return;

    const isImage = fileObj.mimeType?.startsWith('image/') || 
                    /\.(jpe?g|png|webp|gif|bmp)$/i.test(fileObj.name || '') ||
                    /\.(jpe?g|png|webp|gif|bmp)/i.test(fileObj.uri || '');

    // 1. If it's an image, preview directly inside the app without triggering any native filesystem intent
    if (isImage) {
      setPreviewModal({
        visible: true,
        uri: fileObj.uri,
        name: fileObj.name || 'Documento',
      });
      return;
    }

    // 2. If it's a PDF or other document, copy to document directory and open directly
    try {
      const fileExt = fileObj.name ? fileObj.name.split('.').pop() : 'pdf';
      const cleanName = `doc_${Date.now()}.${fileExt}`;
      
      let targetUri = fileObj.uri;
      try {
        const sourceFile = new ModernFile(fileObj.uri);
        const destFile = new ModernFile(Paths.document, cleanName);
        const bytes = await sourceFile.bytes();
        destFile.write(bytes);
        targetUri = destFile.uri;
      } catch (copyErr) {
        console.log('[AuthScreen] Modern copy failed, using original uri:', copyErr);
      }

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(targetUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: fileObj.mimeType || 'application/pdf',
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: fileObj.mimeType || 'application/pdf',
          dialogTitle: 'Visualizza documento',
        });
      } else {
        alert("La visualizzazione di questo tipo di file non è supportata su questo dispositivo.");
      }
    } catch (error) {
      console.error(error);
      alert("Impossibile aprire il file.");
    }
  };

  // Form inputs states (Login & Forgot)
  const [loginEmail, setLoginEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const resetNewPasswordRef = useRef('');
  const resetConfirmPasswordRef = useRef('');
  const loginPasswordRef = useRef('');

  // Password refs to prevent immediate masking on re-render
  const passwordRef = useRef('');
  const confirmPasswordRef = useRef('');

  // Validation/Error states
  const [submitted, setSubmitted] = useState(false);
  const [modifiedFields, setModifiedFields] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Transition helper function
  const navigateToScreen = (targetScreen) => {
    Keyboard.dismiss();
    setCurrentScreen(targetScreen);
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitted(false);
  };

  // Sync with mode prop from parent
  useEffect(() => {
    if (mode === 'login' && currentScreen !== 'login') {
      navigateToScreen('login');
    } else if (mode === 'register' && !currentScreen.startsWith('reg')) {
      navigateToScreen('reg1');
    } else if (mode === 'forgot' && currentScreen !== 'forgot') {
      navigateToScreen('forgot');
    } else if (mode === 'success' && currentScreen !== 'success') {
      navigateToScreen('success');
    }
  }, [mode]);

  // Clear errors and validation states when switching authentication modes
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitted(false);
    setModifiedFields({});
  }, [mode]);

  // Reset form helper
  const resetForm = () => {
    setNome('');
    setCognome('');
    setEmail('');
    setOtpCode('');
    setPeso('');
    setAltezza('');
    setSelectedGender(null);
    setDataNascita('');
    setRuolo('ATLETA');
    setSubmitted(false);
    setModifiedFields({});
    setErrorMessage('');
    setSuccessMessage('');
    passwordRef.current = '';
    confirmPasswordRef.current = '';
    setLoginEmail('');
    setForgotEmail('');
    setForgotOtpCode('');
    resetNewPasswordRef.current = '';
    resetConfirmPasswordRef.current = '';
    loginPasswordRef.current = '';
    setProfileImage(null);
    setDocFronte(null);
    setDocFronteKey('');
    setDocRetro(null);
    setDocRetroKey('');
    setScadenzaDocumento('');
    setCertificazioni([]);
    setCertificazioniKeys('');
  };

  const handleLogin = async () => {
    setSubmitted(true);
    setModifiedFields({});
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
      const response = await fetch(`${getApiUrl()}/api/auth/accedi`, {
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

      // Success: show message first, then immediately update user and return to Home tab
      setSuccessMessage("Accesso effettuato");
      setTimeout(() => {
        onLoginSuccess(data);
        resetForm();
        onClose();
      }, 700);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  // Step 1: Richiesta OTP reset password
  const handleForgotSendOtp = async () => {
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotEmail || !forgotEmail.trim()) {
      setErrorMessage("Inserisci l'email");
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/invia-otp-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.errore || "Errore durante l'invio del codice");
        return;
      }

      setSubmitted(false);
      setSuccessMessage(data.messaggio || "Codice inviato via email");
      setTimeout(() => {
        navigateToScreen('forgotOtp');
      }, 600);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  // Step 2: Verifica codice OTP
  const handleForgotVerifyOtp = async () => {
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotOtpCode || forgotOtpCode.trim().length !== 4) {
      setErrorMessage("Inserisci il codice di verifica a 4 cifre");
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/verifica-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          codice: forgotOtpCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.errore || "Codice non valido o scaduto");
        return;
      }

      setSubmitted(false);
      setSuccessMessage("Codice verificato!");
      setTimeout(() => {
        navigateToScreen('forgotNewPass');
      }, 500);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  // Step 3: Impostazione nuova password
  const handleResetPasswordSubmit = async () => {
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    const newPwd = resetNewPasswordRef.current;
    const confirmPwd = resetConfirmPasswordRef.current;

    if (!newPwd || !confirmPwd) {
      setErrorMessage("Tutti i campi password sono obbligatori");
      return;
    }

    if (newPwd !== confirmPwd) {
      setErrorMessage("Le password non coincidono");
      return;
    }

    if (newPwd.length < 6) {
      setErrorMessage("La password deve contenere almeno 6 caratteri");
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          codice: forgotOtpCode.trim(),
          nuovaPassword: newPwd,
          confermaNuovaPassword: confirmPwd,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.errore || "Errore durante il reset della password");
        return;
      }

      setSuccessMessage(data.messaggio || "Password reimpostata con successo!");
      setTimeout(() => {
        resetForm();
        setMode('login');
      }, 1500);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const formatInputDate = (text, prevValue = '') => {
    if (prevValue && text.length < prevValue.length) {
      if (prevValue.endsWith('/') && text === prevValue.slice(0, -1)) {
        return text.slice(0, -1);
      }
      return text;
    }

    const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
    if (digits.length === 0) return '';
    if (digits.length < 2) return digits;
    if (digits.length === 2) return digits + '/';
    if (digits.length < 4) return digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length === 4) return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/';
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
  };

  const parseDate = (dateStr, allowFuture = false) => {
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
    if (year < 1900) return null;
    if (!allowFuture && year > new Date().getFullYear()) return null;

    const pad = (n) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  const handleStep1Next = async () => {
    setSubmitted(true);
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('L\'email è obbligatoria');
      return;
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Formato email non valido');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/verifica-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await response.json();

      if (!response.ok) {
        if (data && data.errore) {
          setErrorMessage(data.errore);
        } else {
          setErrorMessage('Errore durante la verifica dell\'email');
        }
        return;
      }

      // Send OTP
      try {
        const otpResponse = await fetch(`${getApiUrl()}/api/auth/invia-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });

        const otpData = await otpResponse.json();
        if (!otpResponse.ok) {
          setErrorMessage(otpData.errore || 'Errore durante l\'invio del codice OTP');
          return;
        }

        setSubmitted(false);
        setOtpCode('');
        navigateToScreen('regOtp');
      } catch (otpErr) {
        setErrorMessage('Impossibile inviare il codice di verifica');
        console.error(otpErr);
      }
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleVerifyOtp = async () => {
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (otpCode.length < 4) {
      setErrorMessage('Inserisci il codice di 4 cifre');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/verifica-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
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

      setTimeout(() => {
        setSuccessMessage('');
        navigateToScreen('reg2');
      }, 800);
    } catch (error) {
      setErrorMessage('Impossibile connettersi al server');
      console.error(error);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('Rinvio codice OTP...');
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/invia-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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

  const handleStep2Next = () => {
    setSubmitted(true);
    setErrorMessage('');

    const pwd = (passwordRef.current || '').trim();
    const confirmPwd = (confirmPasswordRef.current || '').trim();

    if (!pwd) {
      setErrorMessage('Inserisci una password');
      return;
    }

    if (pwd.length < 6) {
      setErrorMessage('La password deve contenere almeno 6 caratteri');
      return;
    }

    if (pwd !== confirmPwd) {
      setErrorMessage('Le password non coincidono');
      return;
    }

    setSubmitted(false);
    navigateToScreen('reg3');
  };

  const handleStep3Next = () => {
    setSubmitted(true);
    setErrorMessage('');

    if (!nome.trim() || !cognome.trim() || !dataNascita.trim() || !selectedGender || !ruolo) {
      setErrorMessage('Compila tutti i campi obbligatori');
      return;
    }

    const formattedDate = parseDate(dataNascita.trim());
    if (!formattedDate) {
      setErrorMessage('Data di nascita non valida (formato GG/MM/AAAA)');
      return;
    }

    setSubmitted(false);
    navigateToScreen('reg4');
  };

  const handleStep4Next = () => {
    setSubmitted(false);
    if (ruolo === 'ATLETA') {
      navigateToScreen('reg5');
    } else {
      navigateToScreen('regPtDoc');
    }
  };

  const handlePtDocNext = () => {
    setSubmitted(true);
    setErrorMessage('');

    if (!docFronte || !docRetro) {
      setErrorMessage('Seleziona sia il fronte che il retro del documento');
      return;
    }

    if (!scadenzaDocumento.trim()) {
      setErrorMessage('Inserisci la data di scadenza del documento');
      return;
    }

    const formattedDate = parseDate(scadenzaDocumento.trim(), true);
    if (!formattedDate) {
      setErrorMessage('Data di scadenza non valida (formato GG/MM/AAAA)');
      return;
    }

    setSubmitted(false);
    navigateToScreen('regPtCert');
  };

  const handlePtCertNext = () => {
    handleRegister();
  };

  const uploadFile = async (fileInput, endpointType) => {
    if (!fileInput) return null;

    let uri = '';
    let name = 'file';
    let type = 'application/octet-stream';

    if (typeof fileInput === 'string') {
      uri = fileInput;
      name = uri.split('/').pop() || 'image.jpg';
      const ext = name.split('.').pop()?.toLowerCase();
      type = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/jpeg';
    } else if (typeof fileInput === 'object' && fileInput !== null) {
      uri = fileInput.uri || fileInput.localUri || '';
      name = fileInput.name || uri.split('/').pop() || 'file';
      type = fileInput.mimeType || fileInput.type || 'application/octet-stream';
    }

    if (!uri || typeof uri !== 'string') {
      throw new Error('URI del file non valido');
    }

    const endpoint = endpointType === 'immagine-profilo'
      ? `${getApiUrl()}/api/files/upload-immagine-profilo`
      : `${getApiUrl()}/api/files/upload-documento-pt`;

    let data;
    if (Platform.OS !== 'web') {
      const uploadResult = await FileSystem.uploadAsync(endpoint, uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: type,
        parameters: {}
      });

      try {
        data = JSON.parse(uploadResult.body);
      } catch (e) {
        data = { errore: uploadResult.body };
      }

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(data.errore || 'Errore nel caricamento del file');
      }
    } else {
      const responseBlob = await fetch(uri);
      const blob = await responseBlob.blob();
      const formData = new FormData();
      formData.append('file', blob, name);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      data = await response.json();
      if (!response.ok) {
        throw new Error(data.errore || 'Errore nel caricamento del file');
      }
    }

    return data.url || data.key;
  };

  const handleRegister = async () => {
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('Preparazione registrazione...');

    const pwd = (passwordRef.current || '').trim();
    const formattedDate = parseDate(dataNascita.trim());

    try {
      // 1. Upload profile image if selected
      let uploadedProfileUrl = null;
      if (profileImage) {
        setSuccessMessage('Caricamento immagine del profilo...');
        uploadedProfileUrl = await uploadFile(profileImage, 'immagine-profilo');
      }

      // 2. Upload PT documents if registering as PERSONAL_TRAINER
      let uploadedFronteKey = null;
      let uploadedRetroKey = null;
      let uploadedCertKeys = [];

      if (ruolo === 'PERSONAL_TRAINER') {
        if (!docFronte || !docRetro) {
          setErrorMessage('Seleziona sia il fronte che il retro del documento');
          setSuccessMessage('');
          return;
        }

        setSuccessMessage('Caricamento documento (fronte)...');
        uploadedFronteKey = await uploadFile(docFronte, 'documento-pt');

        setSuccessMessage('Caricamento documento (retro)...');
        uploadedRetroKey = await uploadFile(docRetro, 'documento-pt');

        if (certificazioni.length > 0) {
          for (let i = 0; i < certificazioni.length; i++) {
            setSuccessMessage(`Caricamento certificazione (${i + 1}/${certificazioni.length})...`);
            const certKey = await uploadFile(certificazioni[i], 'documento-pt');
            uploadedCertKeys.push(certKey);
          }
        }
      }

      setSuccessMessage('Completamento registrazione in corso...');

      // 3. Submit registration request
      const response = await fetch(`${getApiUrl()}/api/auth/registra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          cognome: cognome.trim(),
          email: email.trim().toLowerCase(),
          password: pwd,
          peso: ruolo === 'ATLETA' && peso.trim() ? parseFloat(peso.replace(',', '.')) : null,
          altezza: ruolo === 'ATLETA' && altezza.trim() ? parseFloat(altezza.replace(',', '.')) : null,
          genere: selectedGender,
          urlImmagineProfilo: uploadedProfileUrl,
          dataNascita: formattedDate,
          ruolo: ruolo,
          scadenzaDocumento: ruolo === 'PERSONAL_TRAINER' && scadenzaDocumento.trim() ? parseDate(scadenzaDocumento.trim(), true) : null,
          documentoFronteKey: uploadedFronteKey,
          documentoRetroKey: uploadedRetroKey,
          certificazioniKey: uploadedCertKeys.length > 0 ? uploadedCertKeys.join(',') : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errore) {
          setErrorMessage(data.errore);
        } else {
          setErrorMessage('Errore durante la registrazione');
        }
        setSuccessMessage('');
        return;
      }

      resetForm();
      setMode('success');
      navigateToScreen('success');
    } catch (error) {
      setErrorMessage(error.message || 'Impossibile connettersi al server');
      setSuccessMessage('');
      console.error(error);
    }
  };

  const renderMessages = (screen) => {
    const isThisScreen = currentScreen === screen;
    return (
      <View className="h-[52px] mb-6 w-full justify-center items-start">
        {isThisScreen && errorMessage ? (
          <View className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl self-start">
            <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
          </View>
        ) : isThisScreen && successMessage ? (
          <View className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl self-start">
            <Text className="text-emerald-400 text-xs font-semibold">{successMessage}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderStepIndicator = (screenName) => {
    if (!screenName.startsWith('reg')) return null;
    let stepNum;
    if (screenName === 'reg1' || screenName === 'regOtp') stepNum = 1;
    else if (screenName === 'reg2') stepNum = 2;
    else if (screenName === 'reg3') stepNum = 3;
    else if (screenName === 'reg4') stepNum = 4;
    else if (screenName === 'reg5') stepNum = 5;
    else if (screenName === 'regPtDoc') stepNum = 5;
    else if (screenName === 'regPtCert') stepNum = 6;

    const totalSteps = ruolo === 'ATLETA' ? 5 : 6;

    return (
      <View className="flex-row items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isCurrent = idx + 1 === stepNum;
          return (
            <View
              key={idx}
              className={`w-3.5 h-3.5 rounded-[3px] border ${isCurrent
                  ? 'bg-accentCyan border-accentCyan shadow-lg shadow-accentCyan/30'
                  : 'bg-inputDark border-inputBorder'
                }`}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      className="flex-1 bg-premiumDark"
      onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}
    >

      {/* 1. LOGIN SCREEN */}
      {currentScreen === 'login' && (
        <View style={styles.absoluteScreen}>
          {/* Header locale per Accesso */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10" />
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">Accesso</Text>
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

              {renderMessages('login')}

              <View className="w-full">
                {/* Email */}
                <View className="mb-5 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !modifiedFields.loginEmail && !loginEmail.trim() ? 'border-red-500' : 'border-inputBorder'
                      }`}
                    value={loginEmail}
                    onChangeText={(text) => {
                      setLoginEmail(text);
                      setModifiedFields(prev => ({ ...prev, loginEmail: true }));
                    }}
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
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !modifiedFields.loginPassword && !loginPasswordRef.current ? 'border-red-500' : 'border-inputBorder'
                      }`}
                    onChangeText={(text) => {
                      loginPasswordRef.current = text;
                      setModifiedFields(prev => ({ ...prev, loginPassword: true }));
                    }}
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

              {/* Toggle Footer */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-zinc-400 text-sm">Non hai un account?</Text>
                <TouchableOpacity onPress={() => setMode('register')}>
                  <Text className="text-white text-sm font-bold ml-1.5 underline">Registrati</Text>
                </TouchableOpacity>
              </View>

              {/* Social Separator */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-borderDark" />
                <Text className="text-zinc-500 text-xs mx-4 font-bold uppercase tracking-wider">Oppure</Text>
                <View className="flex-1 h-[1px] bg-borderDark" />
              </View>

              {/* Social Buttons */}
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

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* 2. FORGOT SCREEN - STEP 1 (EMAIL) */}
      {currentScreen === 'forgot' && (
        <View style={styles.absoluteScreen}>
          {/* Header locale per Forgot Password */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10 items-start">
              <TouchableOpacity onPress={() => setMode('login')} className="p-1">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">Reimposta password</Text>
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

              {renderMessages('forgot')}

              <View className="w-full">
                <Text className="text-zinc-400 text-sm leading-6 mb-6">
                  Inserisci l'indirizzo email del tuo account. Ti invieremo un codice di verifica per reimpostare la tua password.
                </Text>
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !forgotEmail.trim() ? 'border-red-500' : 'border-inputBorder'
                      }`}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity
                  className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                  activeOpacity={0.8}
                  onPress={handleForgotSendOtp}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Invia Codice OTP</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* 2.1 FORGOT SCREEN - STEP 2 (VERIFICA CODICE OTP) */}
      {currentScreen === 'forgotOtp' && (
        <View style={styles.absoluteScreen}>
          {/* Header locale per Forgot OTP */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10 items-start">
              <TouchableOpacity onPress={() => navigateToScreen('forgot')} className="p-1">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">Verifica Codice</Text>
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

              {renderMessages('forgotOtp')}

              <View className="w-full">
                <Text className="text-zinc-400 text-sm mb-6 text-center leading-relaxed">
                  Abbiamo inviato un codice di 4 cifre a:{"\n"}
                  <Text className="text-white font-bold">{forgotEmail.trim().toLowerCase()}</Text>
                </Text>

                {/* OTP Input */}
                <View className="mb-6 w-full">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Codice di verifica</Text>
                  <TextInput
                    className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-lg font-bold text-center tracking-[10px] focus:border-accentCyan ${
                      submitted && (!forgotOtpCode || forgotOtpCode.length !== 4) ? 'border-red-500' : 'border-inputBorder'
                    }`}
                    value={forgotOtpCode}
                    onChangeText={(val) => setForgotOtpCode(val.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="0000"
                    placeholderTextColor="#52525B"
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity
                  className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                  activeOpacity={0.8}
                  onPress={handleForgotVerifyOtp}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Verifica Codice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="border border-borderDark h-12 rounded-xl justify-center items-center mt-4"
                  activeOpacity={0.8}
                  onPress={handleForgotSendOtp}
                >
                  <Text className="text-zinc-400 text-sm font-bold">Invia di nuovo il codice</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* 2.2 FORGOT SCREEN - STEP 3 (IMPOSTAZIONE NUOVA PASSWORD) */}
      {currentScreen === 'forgotNewPass' && (
        <View style={styles.absoluteScreen}>
          {/* Header locale per Nuova Password */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10 items-start">
              <TouchableOpacity onPress={() => navigateToScreen('forgotOtp')} className="p-1">
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">Nuova Password</Text>
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

              {renderMessages('forgotNewPass')}

              <View className="w-full">
                <Text className="text-zinc-400 text-sm leading-6 mb-6">
                  Crea una nuova password per accedere al tuo account.
                </Text>

                {/* Nuova Password */}
                <PasswordInput
                  label="Nuova Password (min. 6 caratteri)"
                  error={submitted && !resetNewPasswordRef.current}
                  textKey="resetNewPassword"
                  onChangeText={(text) => {
                    resetNewPasswordRef.current = text;
                  }}
                />

                {/* Conferma Nuova Password */}
                <PasswordInput
                  label="Conferma Nuova Password"
                  error={submitted && !resetConfirmPasswordRef.current}
                  textKey="resetConfirmPassword"
                  onChangeText={(text) => {
                    resetConfirmPasswordRef.current = text;
                  }}
                />

                <TouchableOpacity
                  className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                  activeOpacity={0.8}
                  onPress={handleResetPasswordSubmit}
                >
                  <Text className="text-zinc-950 text-[15px] font-bold">Salva Nuova Password</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* 3. REGISTRATION FLOW CONTAINER (anims.regFlow) */}
      {currentScreen.startsWith('reg') && (
        <View style={styles.absoluteScreen}>
          {/* Header fissa condivisa per tutto il flusso di registrazione */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10 items-start">
              {currentScreen.startsWith('reg') && currentScreen !== 'reg1' && (
                <TouchableOpacity
                  onPress={() => {
                    if (currentScreen === 'regOtp') navigateToScreen('reg1');
                    else if (currentScreen === 'reg2') navigateToScreen('reg1');
                    else if (currentScreen === 'reg3') navigateToScreen('reg2');
                    else if (currentScreen === 'reg4') navigateToScreen('reg3');
                    else if (currentScreen === 'reg5') navigateToScreen('reg4');
                    else if (currentScreen === 'regPtDoc') navigateToScreen('reg4');
                    else if (currentScreen === 'regPtCert') navigateToScreen('regPtDoc');
                  }}
                  className="p-1"
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">
                {ruolo === 'PERSONAL_TRAINER' ? 'Registrazione Personal Trainer' : 'Registrazione'}
              </Text>
            </View>

            <View className="w-10" />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 relative overflow-hidden"
          >

            {/* STEP 1 (EMAIL ONLY) */}
            {currentScreen === 'reg1' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('reg1')}
                  {renderMessages('reg1')}

                  <View className="w-full">
                    {/* Email */}
                    <View className="mb-6 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email</Text>
                      <TextInput
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !email.trim() ? 'border-red-500' : 'border-inputBorder'
                          }`}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        scrollEnabled={false}
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handleStep1Next}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Avanti</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Toggle Footer */}
                  <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-zinc-400 text-sm">Hai già un account?</Text>
                    <TouchableOpacity onPress={() => setMode('login')}>
                      <Text className="text-white text-sm font-bold ml-1.5 underline">Accedi</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Social Separator */}
                  <View className="flex-row items-center my-6">
                    <View className="flex-1 h-[1px] bg-borderDark" />
                    <Text className="text-zinc-500 text-xs mx-4 font-bold uppercase tracking-wider">Oppure</Text>
                    <View className="flex-1 h-[1px] bg-borderDark" />
                  </View>

                  {/* Social Buttons */}
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

                  {/* Separator for Switch Button */}
                  <View className="flex-row items-center my-6">
                    <View className="flex-1 h-[1px] bg-borderDark" />
                  </View>

                  {/* PT / Athlete Flow Switch Button */}
                  <TouchableOpacity
                    className="flex-row items-center justify-center py-3 border border-[#303038] rounded-xl bg-[#1E1E24]"
                    activeOpacity={0.8}
                    onPress={() => {
                      setRuolo(ruolo === 'ATLETA' ? 'PERSONAL_TRAINER' : 'ATLETA');
                    }}
                  >
                    <Text className="text-accentCyan text-sm font-bold">
                      {ruolo === 'ATLETA' ? 'Sei un personal trainer?' : 'Non sei un personal trainer?'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* STEP OTP (EMAIL VERIFICATION CODE) */}
            {currentScreen === 'regOtp' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('regOtp')}
                  {renderMessages('regOtp')}

                  <View className="w-full">
                    <Text className="text-zinc-400 text-sm mb-6 text-center leading-relaxed">
                      È stato inviato un codice di 4 cifre all'indirizzo:{"\n"}
                      <Text className="text-white font-bold">{email.trim().toLowerCase()}</Text>
                    </Text>

                    {/* OTP Input */}
                    <View className="mb-6 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Codice di verifica</Text>
                      <TextInput
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-lg font-bold text-center tracking-[10px] focus:border-accentCyan ${submitted && !otpCode.trim() ? 'border-red-500' : 'border-inputBorder'
                          }`}
                        value={otpCode}
                        onChangeText={(val) => setOtpCode(val.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0000"
                        placeholderTextColor="#52525B"
                        scrollEnabled={false}
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handleVerifyOtp}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Verifica Codice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="border border-borderDark h-12 rounded-xl justify-center items-center mt-4"
                      activeOpacity={0.8}
                      onPress={handleResendOtp}
                    >
                      <Text className="text-zinc-400 text-sm font-bold">Invia di nuovo</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* STEP 2 (PASSWORD ONLY) */}
            {currentScreen === 'reg2' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('reg2')}
                  {renderMessages('reg2')}

                  <View className="w-full">
                    {/* Password */}
                    <View className="mb-5 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Password</Text>
                      <TextInput
                        key={`password_${mode}`}
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !(passwordRef.current || '').trim() ? 'border-red-500' : 'border-inputBorder'
                          }`}
                        onChangeText={(text) => {
                          passwordRef.current = text;
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        scrollEnabled={false}
                        autoCorrect={false}
                        textContentType="oneTimeCode"
                      />
                    </View>

                    {/* Confirm Password */}
                    <View className="mb-6 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Conferma Password</Text>
                      <TextInput
                        key={`confirmPassword_${mode}`}
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !(confirmPasswordRef.current || '').trim() ? 'border-red-500' : 'border-inputBorder'
                          }`}
                        onChangeText={(text) => {
                          confirmPasswordRef.current = text;
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        scrollEnabled={false}
                        autoCorrect={false}
                        textContentType="oneTimeCode"
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handleStep2Next}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Avanti</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* STEP 3 (PERSONAL DATA) */}
            {currentScreen === 'reg3' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('reg3')}
                  {renderMessages('reg3')}

                  <View className="w-full">
                    {/* Nome */}
                    <View className="mb-5 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nome</Text>
                      <TextInput
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !nome.trim() ? 'border-red-500' : 'border-inputBorder'
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
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !cognome.trim() ? 'border-red-500' : 'border-inputBorder'
                          }`}
                        value={cognome}
                        onChangeText={setCognome}
                        autoCapitalize="words"
                        scrollEnabled={false}
                      />
                    </View>

                    {/* Data di Nascita */}
                    <View className="mb-5 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Data di Nascita</Text>
                      <TextInput
                        className={`bg-inputDark border rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan ${submitted && !dataNascita.trim() ? 'border-red-500' : 'border-inputBorder'
                          }`}
                        placeholder="GG/MM/AAAA"
                        placeholderTextColor="#71717A"
                        value={dataNascita}
                        onChangeText={(text) => setDataNascita(formatInputDate(text, dataNascita))}
                        keyboardType="number-pad"
                        maxLength={10}
                        scrollEnabled={false}
                      />
                    </View>

                    {/* Genere */}
                    <View className="mb-5 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Genere</Text>
                      <View className="flex-row justify-between gap-3">
                        {['MASCHIO', 'FEMMINA', 'ALTRO'].map((g) => {
                          const label = g === 'MASCHIO' ? 'Maschio' : g === 'FEMMINA' ? 'Femmina' : 'Altro';
                          const isSelected = selectedGender === g;
                          return (
                            <TouchableOpacity
                              key={g}
                              onPress={() => setSelectedGender(isSelected ? null : g)}
                              className={`flex-1 py-3 rounded-xl border items-center justify-center ${isSelected ? 'bg-white border-white' : 'bg-inputDark border-inputBorder'
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


                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handleStep3Next}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Avanti</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* STEP 4 (FOTO PROFILO) */}
            {currentScreen === 'reg4' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('reg4')}
                  {renderMessages('reg4')}

                  <View className="w-full">
                    <View className="mb-6 items-center">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1 text-center">Immagine Profilo</Text>
                      <Text className="text-zinc-500 text-[13px] leading-5 text-center">Puoi anche aggiungerla in seguito</Text>
                    </View>

                    <View className="items-center py-6">
                      {/* Photo Upload Container */}
                      <TouchableOpacity
                        className="w-40 h-40 rounded-full bg-inputDark border-2 border-dashed border-inputBorder justify-center items-center overflow-hidden mb-8 shadow-lg shadow-black/20"
                        activeOpacity={0.8}
                        onPress={handlePickImage}
                      >
                        {profileImage ? (
                          <Image source={{ uri: profileImage }} className="w-full h-full" />
                        ) : (
                          <View className="items-center justify-center">
                            <Ionicons name="camera-outline" size={48} color="#A1A1AA" />
                            <Text className="text-zinc-500 text-xs font-semibold mt-2">Clicca qui</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-white h-12 rounded-xl justify-center items-center w-full shadow-lg shadow-white/5 mb-4"
                        activeOpacity={0.8}
                        onPress={handleStep4Next}
                      >
                        <Text className="text-zinc-950 text-[15px] font-bold">
                          Avanti
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* STEP 5 (DATI FISICI PER ATLETA) */}
            {currentScreen === 'reg5' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('reg5')}
                  {renderMessages('reg5')}

                  <View className="w-full">
                    <View className="mb-6 items-center">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1 text-center">Dati Fisici</Text>
                      <Text className="text-zinc-500 text-[13px] leading-5 text-center">Puoi anche aggiungerli in seguito</Text>
                    </View>

                    {/* Peso & Altezza Row */}
                    <View className="flex-row gap-4 mb-8">
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

                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handleRegister}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Crea Account</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* STEP 5 (PERSONAL TRAINER DOCUMENTO IDENTITÀ) */}
            {currentScreen === 'regPtDoc' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('regPtDoc')}
                  {renderMessages('regPtDoc')}

                  <View className="w-full">
                    <View className="mb-6 items-center">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1 text-center">Documento di Identità</Text>
                      <Text className="text-zinc-500 text-[13px] leading-5 text-center">Carica il fronte e il retro del tuo documento (Immagine o PDF)</Text>
                    </View>

                    {/* Container Fronte e Retro affiancati */}
                    <View className="flex-row gap-4 mb-5">
                      {/* Fronte */}
                      <View className="flex-1">
                        <Text className="text-zinc-400 text-xs font-bold tracking-wider mb-2 uppercase">Fronte</Text>
                        <TouchableOpacity
                          className="w-full h-24 rounded-xl bg-inputDark border border-dashed border-inputBorder justify-center items-center px-3"
                          activeOpacity={0.8}
                          onPress={() => handlePickDocument('fronte')}
                        >
                          {docFronte ? (
                            <View className="items-center justify-center w-full">
                              <Ionicons name="document-text" size={24} color="#FFB430" />
                              <Text className="text-white text-xs font-semibold mt-1.5 text-center" numberOfLines={1}>
                                {docFronte.name}
                              </Text>
                            </View>
                          ) : (
                            <View className="items-center justify-center">
                              <Ionicons name="document-attach-outline" size={24} color="#A1A1AA" />
                              <Text className="text-zinc-500 text-xs font-semibold mt-1 text-center">Carica Fronte</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {docFronte && (
                          <TouchableOpacity 
                            onPress={() => handleViewFile(docFronte)}
                            className="mt-1.5 self-center"
                          >
                            <Text className="text-accentCyan text-[11px] font-bold text-center underline">Visualizza file</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Retro */}
                      <View className="flex-1">
                        <Text className="text-zinc-400 text-xs font-bold tracking-wider mb-2 uppercase">Retro</Text>
                        <TouchableOpacity
                          className="w-full h-24 rounded-xl bg-inputDark border border-dashed border-inputBorder justify-center items-center px-3"
                          activeOpacity={0.8}
                          onPress={() => handlePickDocument('retro')}
                        >
                          {docRetro ? (
                            <View className="items-center justify-center w-full">
                              <Ionicons name="document-text" size={24} color="#FFB430" />
                              <Text className="text-white text-xs font-semibold mt-1.5 text-center" numberOfLines={1}>
                                {docRetro.name}
                              </Text>
                            </View>
                          ) : (
                            <View className="items-center justify-center">
                              <Ionicons name="document-attach-outline" size={24} color="#A1A1AA" />
                              <Text className="text-zinc-500 text-xs font-semibold mt-1 text-center">Carica Retro</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {docRetro && (
                          <TouchableOpacity 
                            onPress={() => handleViewFile(docRetro)}
                            className="mt-1.5 self-center"
                          >
                            <Text className="text-accentCyan text-[11px] font-bold text-center underline">Visualizza file</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Data di Scadenza */}
                    <View className="mb-6 w-full">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Data Scadenza Documento</Text>
                      <TextInput
                        className="bg-inputDark border border-inputBorder rounded-xl px-4 py-0 h-12 color-white text-[15px] focus:border-accentCyan"
                        value={scadenzaDocumento}
                        onChangeText={(text) => setScadenzaDocumento(formatInputDate(text, scadenzaDocumento))}
                        placeholder="GG/MM/AAAA"
                        placeholderTextColor="#52525B"
                        keyboardType="number-pad"
                        maxLength={10}
                        scrollEnabled={false}
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handlePtDocNext}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Avanti</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* STEP 6 (PERSONAL TRAINER CERTIFICAZIONI) */}
            {currentScreen === 'regPtCert' && (
              <View style={styles.absoluteScreen}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="mt-2" />

                  {renderStepIndicator('regPtCert')}
                  {renderMessages('regPtCert')}

                  <View className="w-full">
                    <View className="mb-6 items-center">
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1 text-center">Certificazioni e Lauree</Text>
                      <Text className="text-zinc-500 text-[13px] leading-5 text-center">Carica documenti (Immagini o PDF) per far verificare il tuo account</Text>
                    </View>

                    {/* Elenco file caricati */}
                    <View className="w-full gap-2.5 mb-6">
                      {certificazioni.map((file, idx) => (
                        <View key={idx} className="flex-row items-center justify-between bg-inputDark border border-inputBorder rounded-xl p-3">
                          <View className="flex-row items-center flex-1 mr-3">
                            <Ionicons name="document-text-outline" size={20} color="#FFB430" className="mr-2" />
                            <TouchableOpacity onPress={() => handleViewFile(file)} className="flex-1">
                              <Text className="text-white text-xs font-semibold underline" numberOfLines={1}>
                                {file.name}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity 
                            onPress={() => {
                              setCertificazioni(prev => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity
                        className="w-full py-3 rounded-xl border border-dashed border-inputBorder justify-center items-center bg-inputDark flex-row gap-2"
                        activeOpacity={0.8}
                        onPress={() => handlePickDocument('certificazioni')}
                      >
                        <Ionicons name="add" size={20} color="#A1A1AA" />
                        <Text className="text-zinc-500 text-xs font-bold">Aggiungi Certificazione o Laurea</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className="bg-white h-12 rounded-xl justify-center items-center mt-2 shadow-lg shadow-white/5"
                      activeOpacity={0.8}
                      onPress={handlePtCertNext}
                    >
                      <Text className="text-zinc-950 text-[15px] font-bold">Registrati</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}

          </KeyboardAvoidingView>
        </View>
      )}

      {/* 4. SUCCESS SCREEN */}
      {currentScreen === 'success' && (
        <View style={styles.absoluteScreen}>
          {/* Header locale per Success Screen */}
          <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <View className="w-10" />
            <View className="flex-1 items-center">
              <Text className="text-lg font-bold text-white tracking-tight">Registrazione</Text>
            </View>
            <View className="w-10" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          >
            <View className="w-full items-center py-12">
              <Ionicons name="checkmark-circle" size={80} color="#10B981" className="mb-6" />
              <Text className="text-white text-xl font-bold text-center mb-2">
                Registrazione avvenuta!
              </Text>
              <Text className="text-zinc-400 text-sm text-center mb-8">
                Il tuo account è stato creato con successo.{"\n"}Ora puoi effettuare l'accesso.
              </Text>
              <TouchableOpacity
                className="bg-white h-12 rounded-xl justify-center items-center w-full shadow-lg shadow-white/5"
                activeOpacity={0.8}
                onPress={() => setMode('login')}
              >
                <Text className="text-zinc-950 text-[15px] font-bold">Accedi ora</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* 5. IMAGE PREVIEW MODAL */}
      <Modal
        visible={previewModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModal({ visible: false, uri: null, name: '' })}
      >
        <View className="flex-1 bg-black/90 justify-center items-center p-4">
          <View className="w-full flex-row justify-between items-center px-2 py-4">
            <Text className="text-white text-base font-bold flex-1" numberOfLines={1}>
              {previewModal.name}
            </Text>
            <TouchableOpacity 
              onPress={() => setPreviewModal({ visible: false, uri: null, name: '' })}
              className="p-2"
            >
              <Ionicons name="close-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 w-full justify-center items-center">
            {previewModal.uri && (
              <Image 
                source={{ uri: previewModal.uri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  absoluteScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
});
