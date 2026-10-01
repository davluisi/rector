import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { config } from '../config';

const getApiUrl = () => config.apiUrl;

// Componente per il Player Video nativo in-app
function VideoPlayerModal({ video, visible, onClose }) {
  const player = useVideoPlayer(video?.urlVideo || '', (p) => {
    p.loop = true;
    p.play();
  });

  // Aggiorna la sorgente se cambia il video
  useEffect(() => {
    if (video?.urlVideo && player) {
      if (typeof player.replaceAsync === 'function') {
        player.replaceAsync(video.urlVideo).then(() => player.play()).catch(() => { });
      } else {
        player.replace(video.urlVideo);
        player.play();
      }
    }
  }, [video?.urlVideo]);

  if (!visible || !video) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black justify-center items-center">
        {/* Header con titolo e pulsante chiudi */}
        <View className="absolute top-12 left-0 right-0 z-50 flex-row justify-between items-center px-5 py-2 bg-black/40">
          <Text className="text-white text-base font-bold flex-1 mr-4" numberOfLines={2}>
            {video.nome}
          </Text>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-zinc-800/80 justify-center items-center"
            activeOpacity={0.8}
            onPress={() => {
              if (player) player.pause();
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* VideoView con controlli nativi integrati */}
        <VideoView
          style={{ width: '100%', height: '75%' }}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          startsPictureInPictureAutomatically={false}
          contentFit="contain"
          nativeControls={true}
        />
      </View>
    </Modal>
  );
}

// Modal a tutto schermo per la selezione fluida del frame di anteprima dal video
function FrameSelectorModal({ videoUri, visible, onClose, onConfirmFrame }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);

  // Stato per tracciare se l'utente sta trascinando il cursore con il dito
  const isScrubbingRef = React.useRef(false);
  const lastSeekTimeRef = React.useRef(0);
  const pendingSeekRef = React.useRef(null);
  // Coordinate assolute della barra sullo schermo
  const sliderLayoutRef = React.useRef({ pageX: 0, width: 300 });
  const sliderBarRef = React.useRef(null);

  const player = useVideoPlayer(videoUri || '', (p) => {
    p.loop = true;
    p.pause();
    try {
      p.seekTolerance = { toleranceBefore: 0, toleranceAfter: 0 };
    } catch (e) { }
  });

  useEffect(() => {
    if (videoUri && player) {
      if (typeof player.replaceAsync === 'function') {
        player.replaceAsync(videoUri).then(() => {
          player.pause();
          try {
            player.seekTolerance = { toleranceBefore: 0, toleranceAfter: 0 };
          } catch (e) { }
        }).catch(() => { });
      } else {
        player.replace(videoUri);
        player.pause();
        try {
          player.seekTolerance = { toleranceBefore: 0, toleranceAfter: 0 };
        } catch (e) { }
      }
    }
  }, [videoUri]);

  useEffect(() => {
    if (!player || !visible) return;

    const interval = setInterval(() => {
      // Non aggiornare o sovrascrivere se l'utente sta toccando/trascinando
      if (isScrubbingRef.current) return;

      try {
        if (player.currentTime !== undefined) {
          setCurrentTimeSec(player.currentTime);
        }
        if (player.duration && player.duration > 0) {
          setDurationSec(player.duration);
        }
        if (player.playing !== undefined) {
          setIsPlaying(player.playing);
        }
      } catch (e) { }
    }, 100);

    return () => clearInterval(interval);
  }, [player, visible]);

  if (!visible || !videoUri) return null;

  // Attiva/disattiva le ottimizzazioni di scrubbing per non bloccare la riproduzione normale
  const setScrubbingEnabled = (enabled) => {
    if (!player) return;
    try {
      player.scrubbingModeOptions = {
        scrubbingModeEnabled: enabled,
        increaseCodecOperatingRate: enabled,
        enableDynamicScheduling: enabled,
        useDecodeOnlyFlag: enabled,
        allowSkippingMediaCodecFlush: enabled,
      };
    } catch (e) { }
  };

  // Esegue il seek sul player in modo fluido ed esatto frame-by-frame
  const applySeekToPlayer = (targetSec) => {
    if (!player) return;
    const now = Date.now();
    // 25ms di intervallo per un rendering fluido fino a ~40fps
    if (now - lastSeekTimeRef.current >= 25) {
      lastSeekTimeRef.current = now;
      try {
        player.currentTime = targetSec;
      } catch (e) { }
    } else {
      if (pendingSeekRef.current) clearTimeout(pendingSeekRef.current);
      pendingSeekRef.current = setTimeout(() => {
        try {
          if (player) player.currentTime = targetSec;
        } catch (e) { }
      }, 25);
    }
  };

  // Calcola la posizione precisa usando la coordinata assoluta del tocco sullo schermo (pageX)
  const updateScrubFromPageX = (pageX) => {
    const { pageX: barLeft, width: barWidth } = sliderLayoutRef.current;
    const width = Math.max(20, barWidth);
    const relX = pageX - barLeft;
    const clampedX = Math.max(0, Math.min(width, relX));
    const ratio = clampedX / width;
    const maxDur = durationSec > 0 ? durationSec : 1;
    const target = ratio * maxDur;

    // Aggiornamento immediato al 100% stabile
    setCurrentTimeSec(target);
    applySeekToPlayer(target);
  };

  const handleStep = (delta) => {
    if (!player) return;
    try {
      setScrubbingEnabled(false);
      player.pause();
      setIsPlaying(false);
      const current = player.currentTime || 0;
      const target = Math.max(0, Math.min(durationSec, current + delta));
      player.currentTime = target;
      setCurrentTimeSec(target);
    } catch (e) {
      console.warn('Errore seek:', e);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsCapturing(true);
      const timeToCapture = player?.currentTime !== undefined ? player.currentTime : currentTimeSec;
      await onConfirmFrame(timeToCapture);
      onClose();
    } catch (e) {
      console.warn('Errore cattura frame:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTimeSec / (durationSec || 1)) * 100));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-black pt-12 pb-6 px-4 justify-between">
        {/* Header con titolo e chiudi */}
        <View className="flex-row justify-between items-center pb-3 border-b border-zinc-800">
          <View>
            <Text className="text-white text-base font-bold">Scegli Fotogramma Anteprima</Text>
            <Text className="text-zinc-400 text-xs mt-0.5">
              Trascina la barra o tocca i pulsanti per trovare il frame
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700/60 justify-center items-center"
            activeOpacity={0.8}
            onPress={() => {
              if (player) player.pause();
              onClose();
            }}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Video Player quasi a tutto schermo in Real-Time */}
        <View className="flex-1 my-3 bg-zinc-950 rounded-2xl overflow-hidden justify-center items-center border border-zinc-800 relative">
          <VideoView
            style={{ width: '100%', height: '100%' }}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            startsPictureInPictureAutomatically={false}
            contentFit="contain"
            nativeControls={false}
          />

          {/* Badge Tempo Corrente sovrapposto in alto */}
          <View className="absolute top-4 left-4 bg-black/75 px-3 py-1.5 rounded-lg border border-white/10 flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={14} color="#00D2FF" />
            <Text className="text-white font-mono text-xs font-bold">
              {formatTime(currentTimeSec)} / {formatTime(durationSec)}
            </Text>
          </View>
        </View>

        {/* Sezione Controlli Frame by Frame e Scrubbing Ultra Reattivo */}
        <View className="bg-[#141418] border border-borderDark/60 rounded-2xl p-4 mb-2">
          {/* Barra di scorrimento ultra reattiva e fluida con misurazione assoluta pageX */}
          <View
            ref={sliderBarRef}
            className="h-12 justify-center mb-2"
            onLayout={() => {
              if (sliderBarRef.current?.measure) {
                sliderBarRef.current.measure((x, y, width, height, pageX) => {
                  sliderLayoutRef.current = { pageX: pageX || 0, width: width || 300 };
                });
              }
            }}
            onStartShouldSetResponder={() => true}
            onStartShouldSetResponderCapture={() => true}
            onMoveShouldSetResponder={() => true}
            onMoveShouldSetResponderCapture={() => true}
            onResponderGrant={(evt) => {
              isScrubbingRef.current = true;
              if (player) {
                player.pause();
                setIsPlaying(false);
              }
              setScrubbingEnabled(true);
              updateScrubFromPageX(evt.nativeEvent.pageX);
            }}
            onResponderMove={(evt) => {
              updateScrubFromPageX(evt.nativeEvent.pageX);
            }}
            onResponderRelease={() => {
              setScrubbingEnabled(false);
              setTimeout(() => {
                isScrubbingRef.current = false;
              }, 100);
              if (player) {
                try {
                  player.currentTime = currentTimeSec;
                } catch (e) { }
              }
            }}
            onResponderTerminate={() => {
              setScrubbingEnabled(false);
              setTimeout(() => {
                isScrubbingRef.current = false;
              }, 100);
            }}
          >
            {/* Canale traccia slider */}
            <View className="h-3 bg-zinc-800/90 rounded-full w-full overflow-hidden border border-zinc-700/50">
              <View
                className="h-full bg-accentCyan rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>

            {/* Cursore visivo grande e ben visibile */}
            <View
              pointerEvents="none"
              className="absolute w-6 h-6 rounded-full bg-white border-2 border-accentCyan shadow-xl items-center justify-center"
              style={{
                left: `${progressPercent}%`,
                transform: [{ translateX: -12 }],
              }}
            >
              <View className="w-2 h-2 rounded-full bg-accentCyan" />
            </View>
          </View>

          {/* Tasti di regolazione di precisione & Play/Pause */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700"
                activeOpacity={0.7}
                onPress={() => handleStep(-1)}
              >
                <Text className="text-zinc-300 font-bold text-xs">-1s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700"
                activeOpacity={0.7}
                onPress={() => handleStep(-0.2)}
              >
                <Text className="text-zinc-300 font-bold text-xs">-0.2s</Text>
              </TouchableOpacity>
            </View>

            {/* Play / Pausa */}
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white justify-center items-center shadow-lg"
              activeOpacity={0.8}
              onPress={() => {
                if (!player) return;
                setScrubbingEnabled(false);
                isScrubbingRef.current = false;
                if (isPlaying) {
                  player.pause();
                  setIsPlaying(false);
                } else {
                  player.play();
                  setIsPlaying(true);
                }
              }}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#000000"
                style={isPlaying ? {} : { marginLeft: 2 }}
              />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700"
                activeOpacity={0.7}
                onPress={() => handleStep(0.2)}
              >
                <Text className="text-zinc-300 font-bold text-xs">+0.2s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700"
                activeOpacity={0.7}
                onPress={() => handleStep(1)}
              >
                <Text className="text-zinc-300 font-bold text-xs">+1s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pulsante Conferma Frame */}
        <TouchableOpacity
          className="h-13 bg-[#FEB32F] rounded-xl justify-center items-center shadow-lg py-3.5 flex-row gap-2"
          activeOpacity={0.8}
          onPress={handleConfirm}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="#000000" />
          )}
          <Text className="text-zinc-950 text-sm font-extrabold uppercase tracking-wide">
            {isCapturing ? 'Cattura in corso...' : 'Usa questo fotogramma'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function ArchivioScreen({ user, onBack }) {
  const [gruppi, setGruppi] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(true);
  // Navigazione Explorer: null = root con tutte le cartelle, oppure { type: 'UNGROUPED' | 'GROUP', id, nome }
  const [currentFolder, setCurrentFolder] = useState(null);

  // Player Video nativo state
  const [playingVideo, setPlayingVideo] = useState(null);

  // Modals state
  const [modalGruppoVisible, setModalGruppoVisible] = useState(false);
  const [nomeGruppoInput, setNomeGruppoInput] = useState('');
  const [gruppoInModifica, setGruppoInModifica] = useState(null); // null = crea, oggetto = rinomina

  const [modalVideoVisible, setModalVideoVisible] = useState(false);
  const [modalFrameSelectorVisible, setModalFrameSelectorVisible] = useState(false);
  const [nomeVideoInput, setNomeVideoInput] = useState('');
  const [selectedGruppoForVideo, setSelectedGruppoForVideo] = useState(null);
  const [pickedVideo, setPickedVideo] = useState(null); // { uri, name, type }
  const [pickedThumbnail, setPickedThumbnail] = useState(null); // uri locale del thumbnail generato o selezionato
  const [thumbnailOffset, setThumbnailOffset] = useState(1); // secondo scelto per il frame (default 1s)
  const [videoDuration, setVideoDuration] = useState(10); // durata stimata/rilevata in secondi
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [videoInModifica, setVideoInModifica] = useState(null); // null = upload nuovo, oggetto = modifica nome/gruppo

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal Conferma Eliminazione personalizzata (Gruppi e Video)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({
    visible: false,
    tipo: null, // 'gruppo' | 'video'
    item: null,
    isDeleting: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resGruppi, resVideo] = await Promise.all([
        fetch(`${getApiUrl()}/api/archivio/gruppi?idPt=${user.id}`),
        fetch(`${getApiUrl()}/api/archivio/video?idPt=${user.id}`),
      ]);

      if (resGruppi.ok) {
        const dataG = await resGruppi.json();
        setGruppi(dataG);
      }
      if (resVideo.ok) {
        const dataV = await resVideo.json();
        setVideoList(dataV);
      }
    } catch (e) {
      console.error('Errore nel caricamento dell\'archivio:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Gestione creazione/rinomina gruppo
  const handleSalvaGruppo = async () => {
    if (!nomeGruppoInput.trim()) {
      setErrorMessage('Inserisci il nome del gruppo');
      return;
    }

    try {
      setErrorMessage('');
      if (gruppoInModifica) {
        // Rinomina
        const res = await fetch(`${getApiUrl()}/api/archivio/gruppi/${gruppoInModifica.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nomeGruppoInput.trim() }),
        });
        if (res.ok) {
          setModalGruppoVisible(false);
          setNomeGruppoInput('');
          setGruppoInModifica(null);
          loadData();
        } else {
          const err = await res.json();
          setErrorMessage(err.errore || 'Errore nella modifica del gruppo');
        }
      } else {
        // Crea nuovo gruppo
        const res = await fetch(`${getApiUrl()}/api/archivio/gruppi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idPt: user.id,
            nome: nomeGruppoInput.trim(),
          }),
        });
        if (res.ok) {
          setModalGruppoVisible(false);
          setNomeGruppoInput('');
          loadData();
        } else {
          const err = await res.json();
          setErrorMessage(err.errore || 'Errore nella creazione del gruppo');
        }
      }
    } catch (e) {
      setErrorMessage('Errore di connessione al server');
    }
  };

  const handleEliminaGruppo = (gruppo) => {
    setConfirmDeleteModal({
      visible: true,
      tipo: 'gruppo',
      item: gruppo,
      isDeleting: false,
    });
  };

  const eseguiEliminazioneGruppo = async () => {
    const gruppo = confirmDeleteModal.item;
    if (!gruppo) return;

    try {
      setConfirmDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const res = await fetch(`${getApiUrl()}/api/archivio/gruppi/${gruppo.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (currentFolder && currentFolder.id === gruppo.id) {
          setCurrentFolder(null);
        }
        setConfirmDeleteModal({ visible: false, tipo: null, item: null, isDeleting: false });
        loadData();
      } else {
        setConfirmDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (e) {
      console.error(e);
      setConfirmDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Genera thumbnail a partire dal frame al secondo (float) indicato
  const extractThumbnailAtTime = async (videoUri, seconds = 0) => {
    try {
      setIsGeneratingThumbnail(true);
      const timeMs = Math.max(0, Math.round(seconds * 1000));

      let sourceUri = videoUri;

      // Su Android, se il video è remoto (https), scaricalo prima come file locale temporaneo
      // perché VideoThumbnails.getThumbnailAsync potrebbe non gestire bene gli URL remoti
      if (Platform.OS !== 'web' && videoUri && videoUri.startsWith('http')) {
        try {
          const ext = videoUri.split('.').pop()?.split('?')[0] || 'mp4';
          const localPath = `${FileSystem.cacheDirectory}tmp_video_for_thumb.${ext}`;
          const downloadRes = await FileSystem.downloadAsync(videoUri, localPath);
          if (downloadRes?.uri) {
            sourceUri = downloadRes.uri;
          }
        } catch (dlErr) {
          console.warn('Download video per thumbnail fallito, uso URL diretto:', dlErr);
        }
      }

      const { uri } = await VideoThumbnails.getThumbnailAsync(sourceUri, {
        time: timeMs,
        quality: 0.85,
      });

      // Usa ImageManipulator per re-processare il thumbnail in una posizione leggibile.
      // FileSystem non riesce a leggere la cache di VideoThumbnails su Android/Expo Go,
      // ma ImageManipulator usa internamente BitmapFactory che può accedervi.
      let finalUri = uri;
      if (Platform.OS !== 'web' && uri) {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [], // nessuna trasformazione, solo re-salvataggio
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
          );
          finalUri = manipResult.uri;
        } catch (manipErr) {
          console.warn('Re-process thumbnail con ImageManipulator fallito, uso URI originale:', manipErr);
        }
      }

      setPickedThumbnail(finalUri);
      setThumbnailOffset(seconds);
      return finalUri;
    } catch (e) {
      console.warn('Impossibile estrarre frame dal video:', e);
      return null;
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  // Selezione video dal dispositivo
  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permesso per accedere alla libreria multimediale negato.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const filename = asset.fileName || asset.uri.split('/').pop() || 'video.mp4';
      const ext = filename.split('.').pop()?.toLowerCase();
      const mimeType = asset.mimeType || (ext ? `video/${ext}` : 'video/mp4');

      const durationMs = asset.duration ? (asset.duration > 1000 ? asset.duration : asset.duration * 1000) : 10000;
      const durationSec = Math.max(1, Math.round(durationMs / 1000));

      // Limite massimo di 60 secondi per i video degli esercizi
      if (durationSec > 60) {
        Alert.alert(
          'Video troppo lungo',
          `La durata massima consentita per un video esercizio è di 1 minuto (60 secondi). Il video selezionato dura ${Math.floor(durationSec / 60)}m ${durationSec % 60}s. Taglia il video prima di caricarlo.`
        );
        return;
      }

      setVideoDuration(durationSec);

      setPickedVideo({
        uri: asset.uri,
        name: filename,
        type: mimeType,
      });
      setThumbnailOffset(0);

      // Estrai automaticamente il primo frame a 0s o 0.5s come anteprima iniziale
      extractThumbnailAtTime(asset.uri, Math.min(0.5, durationSec));
    }
  };

  // Possibilità alternativa di scegliere un'immagine personalizzata per l'anteprima
  const handlePickCustomThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permesso per accedere alla libreria multimediale negato.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedThumbnail(result.assets[0].uri);
    }
  };

  // Upload video e anteprima su S3 e salvataggio nell'archivio
  const handleSalvaVideo = async () => {
    if (!nomeVideoInput.trim()) {
      setErrorMessage('Inserisci il nome dell\'esercizio');
      return;
    }

    setErrorMessage('');

    // Se stiamo modificando un video esistente (nome, gruppo, anteprima o nuovo file video)
    if (videoInModifica) {
      try {
        setIsUploading(true);

        let finalVideoUrl = videoInModifica.urlVideo || null;
        let finalThumbnailUrl = videoInModifica.urlAnteprima || null;

        // Se è stato selezionato un nuovo file video dal dispositivo
        const hasPickedNewVideo = pickedVideo && pickedVideo.uri && pickedVideo.uri !== videoInModifica.urlVideo;

        if (hasPickedNewVideo) {
          setUploadStatus('Caricamento nuovo video su cloud...');
          const uploadEndpoint = `${getApiUrl()}/api/files/upload-video-esercizio`;

          if (Platform.OS !== 'web') {
            const uploadResult = await FileSystem.uploadAsync(uploadEndpoint, pickedVideo.uri, {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              mimeType: pickedVideo.type || 'video/mp4',
              parameters: {},
            });

            let data;
            try {
              data = JSON.parse(uploadResult.body);
            } catch (e) {
              data = { errore: uploadResult.body };
            }

            if (uploadResult.status === 413 || (data.errore && data.errore.includes('MaxUploadSizeExceededException'))) {
              throw new Error('Il file video supera la dimensione massima consentita (200MB).');
            }

            if (uploadResult.status < 200 || uploadResult.status >= 300) {
              throw new Error(data.errore || 'Errore nel caricamento del video');
            }
            finalVideoUrl = data.url;
          } else {
            const responseBlob = await fetch(pickedVideo.uri);
            const blob = await responseBlob.blob();
            const formData = new FormData();
            formData.append('file', blob, pickedVideo.name || 'video.mp4');

            const response = await fetch(uploadEndpoint, {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.errore || 'Errore nel caricamento del video');
            }
            finalVideoUrl = data.url;
          }
        }

        // Se è stata scelta una nuova anteprima per il video esistente (o generata dal nuovo video)
        if (pickedThumbnail && pickedThumbnail !== videoInModifica.urlAnteprima) {
          setUploadStatus('Caricamento anteprima...');
          const thumbUploadEndpoint = `${getApiUrl()}/api/files/upload-anteprima-esercizio`;

          if (Platform.OS !== 'web') {
            const thumbUploadRes = await FileSystem.uploadAsync(thumbUploadEndpoint, pickedThumbnail, {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              mimeType: 'image/jpeg',
              parameters: {},
            });

            let thumbData;
            try {
              thumbData = JSON.parse(thumbUploadRes.body);
            } catch (e) {
              thumbData = { errore: thumbUploadRes.body };
            }

            if (thumbUploadRes.status < 200 || thumbUploadRes.status >= 300) {
              throw new Error(thumbData.errore || "Errore nel caricamento dell'anteprima");
            }
            finalThumbnailUrl = thumbData.url;
          } else {
            const thumbBlobRes = await fetch(pickedThumbnail);
            const blob = await thumbBlobRes.blob();
            const fd = new FormData();
            fd.append('file', blob, 'thumbnail.jpg');

            const res = await fetch(thumbUploadEndpoint, { method: 'POST', body: fd });
            const td = await res.json();
            if (!res.ok) {
              throw new Error(td.errore || "Errore nel caricamento dell'anteprima");
            }
            finalThumbnailUrl = td.url;
          }
        }

        setUploadStatus('Aggiornamento esercizio...');
        const res = await fetch(`${getApiUrl()}/api/archivio/video/${videoInModifica.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: nomeVideoInput.trim(),
            idGruppo: selectedGruppoForVideo,
            urlVideo: finalVideoUrl,
            urlAnteprima: finalThumbnailUrl,
          }),
        });

        if (res.ok) {
          setModalVideoVisible(false);
          setVideoInModifica(null);
          setNomeVideoInput('');
          setPickedVideo(null);
          setPickedThumbnail(null);
          setSelectedGruppoForVideo(null);
          loadData();
        } else {
          const err = await res.json();
          setErrorMessage(err.errore || 'Errore nel salvataggio');
        }
      } catch (e) {
        setErrorMessage(e.message || 'Errore durante l\'aggiornamento');
      } finally {
        setIsUploading(false);
        setUploadStatus('');
      }
      return;
    }

    // Se è un nuovo caricamento
    if (!pickedVideo) {
      setErrorMessage('Seleziona un video da caricare');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Caricamento video su cloud...');

      let uploadedUrl = null;
      const uploadEndpoint = `${getApiUrl()}/api/files/upload-video-esercizio`;

      if (Platform.OS !== 'web') {
        const uploadResult = await FileSystem.uploadAsync(uploadEndpoint, pickedVideo.uri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: pickedVideo.type || 'video/mp4',
          parameters: {},
        });

        let data;
        try {
          data = JSON.parse(uploadResult.body);
        } catch (e) {
          data = { errore: uploadResult.body };
        }

        if (uploadResult.status === 413 || (data.errore && data.errore.includes('MaxUploadSizeExceededException'))) {
          throw new Error('Il file video supera la dimensione massima consentita (200MB).');
        }

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          throw new Error(data.errore || 'Errore nel caricamento del video');
        }
        uploadedUrl = data.url;
      } else {
        const responseBlob = await fetch(pickedVideo.uri);
        const blob = await responseBlob.blob();
        const formData = new FormData();
        formData.append('file', blob, pickedVideo.name);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.errore || 'Errore nel caricamento del video');
        }
        uploadedUrl = data.url;
      }

      // Caricamento anteprima (se disponibile)
      let uploadedThumbnailUrl = null;
      if (pickedThumbnail) {
        setUploadStatus('Caricamento anteprima...');
        const thumbEndpoint = `${getApiUrl()}/api/files/upload-anteprima-esercizio`;
        try {
          if (Platform.OS !== 'web') {
            const thumbUploadRes = await FileSystem.uploadAsync(thumbEndpoint, pickedThumbnail, {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              mimeType: 'image/jpeg',
              parameters: {},
            });

            let thumbData;
            try {
              thumbData = JSON.parse(thumbUploadRes.body);
            } catch (e) {
              thumbData = { errore: thumbUploadRes.body };
            }

            if (thumbUploadRes.status >= 200 && thumbUploadRes.status < 300) {
              uploadedThumbnailUrl = thumbData.url;
            } else {
              console.warn('Upload anteprima fallito, status:', thumbUploadRes.status);
            }
          } else {
            const thumbBlobRes = await fetch(pickedThumbnail);
            const blob = await thumbBlobRes.blob();
            const fd = new FormData();
            fd.append('file', blob, 'thumbnail.jpg');

            const response = await fetch(thumbEndpoint, {
              method: 'POST',
              body: fd,
            });

            if (response.ok) {
              const tData = await response.json();
              uploadedThumbnailUrl = tData.url;
            }
          }
        } catch (thumbErr) {
          console.warn('Errore durante caricamento anteprima:', thumbErr);
        }
      }

      setUploadStatus('Registrazione video nell\'archivio...');

      // Salva nel database
      const saveRes = await fetch(`${getApiUrl()}/api/archivio/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPt: user.id,
          nome: nomeVideoInput.trim(),
          urlVideo: uploadedUrl,
          urlAnteprima: uploadedThumbnailUrl,
          idGruppo: selectedGruppoForVideo,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.errore || 'Errore nel salvataggio del video');
      }

      setModalVideoVisible(false);
      setNomeVideoInput('');
      setPickedVideo(null);
      setPickedThumbnail(null);
      setSelectedGruppoForVideo(null);
      loadData();
    } catch (e) {
      setErrorMessage(e.message || 'Errore durante l\'operazione');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleEliminaVideo = (video) => {
    setConfirmDeleteModal({
      visible: true,
      tipo: 'video',
      item: video,
      isDeleting: false,
    });
  };

  const eseguiEliminazioneVideo = async () => {
    const video = confirmDeleteModal.item;
    if (!video) return;

    try {
      setConfirmDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const res = await fetch(`${getApiUrl()}/api/archivio/video/${video.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDeleteModal({ visible: false, tipo: null, item: null, isDeleting: false });
        loadData();
      } else {
        setConfirmDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      }
    } catch (e) {
      console.error(e);
      setConfirmDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Riproduci video nativamente in-app
  const handlePlayVideo = (video) => {
    if (!video.urlVideo) return;
    setPlayingVideo(video);
  };

  // Video senza gruppo
  const ungroupedVideos = videoList.filter((v) => !v.idGruppo);

  // Video presenti nella cartella correntemente aperta
  const videosInCurrentFolder = currentFolder
    ? currentFolder.type === 'UNGROUPED'
      ? ungroupedVideos
      : videoList.filter((v) => v.idGruppo === currentFolder.id)
    : [];

  return (
    <View className="flex-1 bg-premiumDark">
      {/* Header Archivio con navigazione a cartelle */}
      <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
        <TouchableOpacity
          className="w-10 h-10 justify-center items-center rounded-xl bg-[#16161A] border border-borderDark/40"
          activeOpacity={0.7}
          onPress={() => {
            if (currentFolder) {
              setCurrentFolder(null); // Torna alla vista principale delle cartelle
            } else {
              onBack(); // Torna al profilo
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1 items-center px-2 mr-10">
          <Text className="text-lg font-bold text-white tracking-tight" numberOfLines={1}>
            {currentFolder ? currentFolder.nome : 'Archivio Esercizi'}
          </Text>
        </View>
        {/* Placeholder bilanciamento back button */}
        <View className="w-10" />
      </View>


      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text className="text-zinc-500 text-xs font-semibold mt-3">Caricamento archivio...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 }}
        >
          {/* VISTA 1: ROOT DIRECTORY (Elenco Cartelle stile Explorer) */}
          {!currentFolder ? (
            <View>
              {/* Header Sezione Azioni: Nuovo gruppo & Nuovo video esercizio */}
              <View className="flex-row justify-end items-center gap-2 mb-4">
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 bg-[#1E1E24] px-3 py-1.5 rounded-xl border border-borderDark/60"
                  activeOpacity={0.7}
                  onPress={() => {
                    setGruppoInModifica(null);
                    setNomeGruppoInput('');
                    setErrorMessage('');
                    setModalGruppoVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFB430" />
                  <Text className="text-zinc-300 text-xs font-bold">Nuovo gruppo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center gap-1.5 bg-[#1E1E24] px-3 py-1.5 rounded-xl border border-borderDark/60"
                  activeOpacity={0.7}
                  onPress={() => {
                    setVideoInModifica(null);
                    setNomeVideoInput('');
                    setPickedVideo(null);
                    setPickedThumbnail(null);
                    setSelectedGruppoForVideo(null);
                    setErrorMessage('');
                    setModalVideoVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFB430" />
                  <Text className="text-zinc-300 text-xs font-bold">Nuovo video esercizio</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                {/* 1. Cartella dei video senza gruppo assegnato: "Senza gruppo" */}
                <TouchableOpacity
                  className="bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-row items-center justify-between"
                  activeOpacity={0.7}
                  onPress={() =>
                    setCurrentFolder({
                      type: 'UNGROUPED',
                      id: null,
                      nome: 'Senza gruppo',
                    })
                  }
                >
                  <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                    <View className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-borderDark justify-center items-center">
                      <Ionicons name="folder-open-outline" size={24} color="#A1A1AA" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-[15px] font-bold">Senza gruppo</Text>
                      <Text className="text-zinc-500 text-xs mt-0.5">
                        {ungroupedVideos.length} {ungroupedVideos.length === 1 ? 'video' : 'video'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#52525B" />
                </TouchableOpacity>

                {/* 2. Cartelle dei gruppi creati dal personal trainer */}
                {gruppi.map((g) => (
                  <View
                    key={g.id}
                    className="bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-row items-center justify-between"
                  >
                    <TouchableOpacity
                      className="flex-row items-center gap-3.5 flex-1 pr-2"
                      activeOpacity={0.7}
                      onPress={() =>
                        setCurrentFolder({
                          type: 'GROUP',
                          id: g.id,
                          nome: g.nome,
                        })
                      }
                    >
                      <View className="w-12 h-12 rounded-xl bg-[#FEB32F]/15 border border-[#FEB32F]/30 justify-center items-center">
                        <Ionicons name="folder" size={24} color="#FEB32F" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-[15px] font-bold leading-snug">
                          {g.nome}
                        </Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">
                          {g.numeroVideo} {g.numeroVideo === 1 ? 'video' : 'video'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Azioni Cartella (Rinomina / Elimina) */}
                    <View className="flex-col items-center gap-1.5">
                      <TouchableOpacity
                        className="w-8 h-8 justify-center items-center rounded-lg bg-[#1E1E24] border border-borderDark/50"
                        activeOpacity={0.7}
                        onPress={() => {
                          setGruppoInModifica(g);
                          setNomeGruppoInput(g.nome);
                          setErrorMessage('');
                          setModalGruppoVisible(true);
                        }}
                      >
                        <Ionicons name="pencil" size={13} color="#A1A1AA" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="w-8 h-8 justify-center items-center rounded-lg bg-accentPink/10 border border-accentPink/20"
                        activeOpacity={0.7}
                        onPress={() => handleEliminaGruppo(g)}
                      >
                        <Ionicons name="trash-outline" size={13} color="#A0132C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            /* VISTA 2: DENTRO LA CARTELLA SELEZIONATA */
            <View>
              {/* Header con pulsante per aggiungere un video direttamente in questa cartella */}
              <View className="flex-row justify-end items-center mb-4">
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 bg-[#1E1E24] px-3 py-1.5 rounded-xl border border-borderDark/60"
                  activeOpacity={0.7}
                  onPress={() => {
                    setVideoInModifica(null);
                    setNomeVideoInput('');
                    setPickedVideo(null);
                    setPickedThumbnail(null);
                    setSelectedGruppoForVideo(
                      currentFolder.type !== 'UNGROUPED' ? currentFolder.id : null
                    );
                    setErrorMessage('');
                    setModalVideoVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#FFB430" />
                  <Text className="text-zinc-300 text-xs font-bold">Nuovo video esercizio</Text>
                </TouchableOpacity>
              </View>

              {videosInCurrentFolder.length === 0 ? (
                <View className="bg-[#16161A]/40 border border-borderDark/40 rounded-3xl p-8 items-center justify-center mt-2">
                  <Ionicons name="film-outline" size={48} color="#303038" className="mb-3" />
                  <Text className="text-zinc-400 font-bold text-sm text-center">
                    Nessun video presente
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {videosInCurrentFolder.map((video) => (
                    <View
                      key={video.id}
                      className="bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-3.5 flex-row items-stretch"
                    >
                      {/* Thumbnail Anteprima Video verticale (proporzione smartphone) con tocco per riprodurre */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handlePlayVideo(video)}
                        className="w-20 h-32 rounded-xl bg-zinc-900 border border-borderDark/60 overflow-hidden justify-center items-center relative"
                      >
                        {video.urlAnteprima ? (
                          <Image
                            source={{ uri: video.urlAnteprima }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full bg-[#1E1E24] justify-center items-center">
                            <Ionicons name="film-outline" size={24} color="#71717A" />
                          </View>
                        )}
                        {/* Badge Play sovrapposto semitrasparente */}
                        <View className="absolute inset-0 bg-black/35 justify-center items-center">
                          <View className="w-8 h-8 rounded-full bg-black/50 justify-center items-center pl-0.5 border border-white/20">
                            <Ionicons name="play" size={16} color="#FFFFFF" />
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Colonna Destra: Nome in alto, Azioni in basso a destra */}
                      <View className="flex-1 ml-3.5 justify-between py-0.5">
                        {/* Nome dell'esercizio in alto */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handlePlayVideo(video)}
                        >
                          <Text className="text-white text-[15px] font-bold leading-snug">
                            {video.nome}
                          </Text>
                        </TouchableOpacity>

                        {/* Azioni Video: Modifica / Elimina in basso a destra */}
                        <View className="flex-row items-center justify-end gap-2 mt-2">
                          <TouchableOpacity
                            className="w-8 h-8 justify-center items-center rounded-lg bg-[#1E1E24] border border-borderDark/50"
                            activeOpacity={0.7}
                            onPress={() => {
                              setVideoInModifica(video);
                              setNomeVideoInput(video.nome);
                              setSelectedGruppoForVideo(video.idGruppo || null);
                              setPickedThumbnail(video.urlAnteprima || null);
                              setPickedVideo(
                                video.urlVideo
                                  ? {
                                    uri: video.urlVideo,
                                    name: video.nome || 'video.mp4',
                                    type: 'video/mp4',
                                  }
                                  : null
                              );
                              setVideoDuration(60);
                              setThumbnailOffset(0);
                              setErrorMessage('');
                              setModalVideoVisible(true);
                            }}
                          >
                            <Ionicons name="pencil" size={13} color="#A1A1AA" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            className="w-8 h-8 justify-center items-center rounded-lg bg-accentPink/10 border border-accentPink/20"
                            activeOpacity={0.7}
                            onPress={() => handleEliminaVideo(video)}
                          >
                            <Ionicons name="trash-outline" size={13} color="#A0132C" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL GESTIONE GRUPPO (CREA / RINOMINA) */}
      <Modal
        visible={modalGruppoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalGruppoVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-[#18181C] border border-borderDark w-full rounded-3xl p-6 shadow-2xl">
            <Text className="text-lg font-bold text-white mb-1">
              {gruppoInModifica ? 'Rinomina Gruppo' : 'Nuovo Gruppo'}
            </Text>
            <Text className="text-zinc-400 text-xs mb-4">
              I gruppi ti permettono di organizzare i tuoi video come in cartelle (es. Gambe, Dorso, Riscaldamento).
            </Text>

            {errorMessage ? (
              <View className="bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl mb-3">
                <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
              </View>
            ) : null}

            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nome Gruppo</Text>
            <TextInput
              className="bg-inputDark border border-inputBorder rounded-xl px-4 h-12 color-white text-[15px] focus:border-accentCyan mb-6"
              placeholder="es. Petto & Tricipiti"
              placeholderTextColor="#52525B"
              value={nomeGruppoInput}
              onChangeText={setNomeGruppoInput}
              autoFocus
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-inputDark border border-inputBorder h-12 rounded-xl justify-center items-center"
                activeOpacity={0.8}
                onPress={() => setModalGruppoVisible(false)}
              >
                <Text className="text-zinc-300 font-bold text-sm">Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#FEB32F] h-12 rounded-xl justify-center items-center shadow-lg shadow-[#FEB32F]/10"
                activeOpacity={0.8}
                onPress={handleSalvaGruppo}
              >
                <Text className="text-zinc-950 font-bold text-sm">Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CARICAMENTO / MODIFICA VIDEO A TUTTO SCHERMO */}
      <Modal
        visible={modalVideoVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => !isUploading && setModalVideoVisible(false)}
      >
        <View className="flex-1 bg-premiumDark pt-12 pb-6 px-5">
          {/* Header Modal a tutto schermo */}
          <View className="flex-row justify-between items-center pb-4 border-b border-borderDark/40 mb-4">
            <Text className="text-xl font-bold text-white tracking-tight">
              {videoInModifica ? 'Modifica Esercizio' : 'Carica Video Esercizio'}
            </Text>
            {!isUploading && (
              <TouchableOpacity
                className="w-9 h-9 rounded-xl bg-[#202026] border border-borderDark/60 justify-center items-center"
                onPress={() => setModalVideoVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {errorMessage ? (
            <View className="bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl mb-4">
              <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="flex-1">
            {/* Nome dell'esercizio */}
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
              Nome Esercizio
            </Text>
            <TextInput
              className="bg-inputDark border border-inputBorder rounded-xl px-4 h-12 color-white text-[15px] focus:border-accentCyan mb-4"
              value={nomeVideoInput}
              onChangeText={setNomeVideoInput}
              editable={!isUploading}
            />

            {/* Selettore Gruppo */}
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
              Gruppo (opzionale)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-1 px-1">
              {gruppi.map((g) => {
                const isSelected = selectedGruppoForVideo === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    className={`mr-2 px-3.5 py-2 rounded-xl border ${isSelected
                        ? 'bg-[#FEB32F]/20 border-[#FEB32F]'
                        : 'bg-inputDark border-borderDark/60'
                      }`}
                    activeOpacity={0.7}
                    onPress={() => setSelectedGruppoForVideo(isSelected ? null : g.id)}
                    disabled={isUploading}
                  >
                    <Text
                      className={`text-xs font-bold ${isSelected ? 'text-[#FEB32F]' : 'text-zinc-300'
                        }`}
                    >
                      {g.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* File Video: sempre presente sia per nuovo che per modifica */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                File Video
              </Text>
              <TouchableOpacity
                className={`border rounded-xl px-4 py-2.5 flex-row items-center justify-between ${pickedVideo
                    ? 'bg-accentCyan/10 border-accentCyan/40'
                    : 'bg-inputDark/60 border-borderDark/70'
                  }`}
                activeOpacity={0.8}
                onPress={handlePickVideo}
                disabled={isUploading}
              >
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <Ionicons
                    name={pickedVideo ? 'videocam' : 'cloud-upload-outline'}
                    size={18}
                    color={pickedVideo ? '#00D2FF' : '#A1A1AA'}
                  />
                  <Text className="text-white text-xs font-semibold flex-1" numberOfLines={1}>
                    {pickedVideo ? pickedVideo.name : 'Seleziona un video dalla galleria'}
                  </Text>
                </View>
                {pickedVideo ? (
                  <Text className="text-accentCyan text-xs font-bold">
                    Sostituisci
                  </Text>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Sezione Anteprima Grande con Pulsante Selettore Frame a Tutto Schermo */}
            {(pickedVideo || pickedThumbnail || videoInModifica) && (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Anteprima Video
                  </Text>
                  {pickedVideo && thumbnailOffset > 0 ? (
                    <Text className="text-zinc-500 font-medium text-xs">
                      Frame impostato a: {Math.floor(thumbnailOffset / 60)}:
                      {Math.floor(thumbnailOffset % 60).toString().padStart(2, '0')}.
                      {Math.floor((thumbnailOffset % 1) * 10)}
                    </Text>
                  ) : null}
                </View>

                {/* Box Anteprima Verticale con proporzioni smartphone */}
                <View className="items-center mb-3">
                  <TouchableOpacity
                    activeOpacity={pickedVideo ? 0.9 : 1}
                    onPress={() => {
                      if (pickedVideo) {
                        setModalFrameSelectorVisible(true);
                      }
                    }}
                    className="w-48 h-80 rounded-2xl bg-zinc-950 border border-borderDark/80 overflow-hidden justify-center items-center relative"
                  >
                    {pickedThumbnail ? (
                      <Image
                        source={{ uri: pickedThumbnail }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full bg-[#18181C] justify-center items-center p-4">
                        <Ionicons name="film-outline" size={44} color="#52525B" />
                        <Text className="text-zinc-500 text-xs mt-2 text-center font-medium">Nessuna anteprima disponibile</Text>
                      </View>
                    )}

                    {/* Icona play bianca sovrapposta in trasparenza */}
                    <View className="absolute inset-0 bg-black/25 justify-center items-center">
                      <View className="w-14 h-14 rounded-full bg-black/60 justify-center items-center pl-1 border border-white/20">
                        {isGeneratingThumbnail ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons name="play" size={28} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Pulsante dedicato per aprire la selezione del frame a tutto schermo */}
                {pickedVideo && (
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 bg-[#1A1A20] border border-accentCyan/40 py-3 rounded-xl shadow-sm"
                    activeOpacity={0.8}
                    disabled={isUploading}
                    onPress={() => setModalFrameSelectorVisible(true)}
                  >
                    <Ionicons name="scan-outline" size={18} color="#00D2FF" />
                    <Text className="text-accentCyan font-bold text-xs tracking-wide uppercase">
                      Scegli fotogramma a tutto schermo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Barra di caricamento se in upload */}
            {isUploading && (
              <View className="items-center py-3 mb-4">
                <ActivityIndicator size="small" color="#00D2FF" />
                <Text className="text-accentCyan text-xs font-semibold mt-2">{uploadStatus}</Text>
              </View>
            )}

            {/* Pulsante Conferma */}
            <TouchableOpacity
              className={`h-12 rounded-xl justify-center items-center shadow-lg mb-6 ${isUploading ? 'bg-zinc-700' : 'bg-white'
                }`}
              activeOpacity={0.8}
              onPress={handleSalvaVideo}
              disabled={isUploading}
            >
              <Text className="text-zinc-950 text-[15px] font-bold">
                {videoInModifica ? 'Salva Modifiche' : 'Carica nell\'Archivio'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL SELEZIONE FRAME A TUTTO SCHERMO IN TEMPO REALE */}
      <FrameSelectorModal
        videoUri={pickedVideo?.uri}
        visible={modalFrameSelectorVisible}
        onClose={() => setModalFrameSelectorVisible(false)}
        onConfirmFrame={async (timeSec) => {
          if (pickedVideo) {
            await extractThumbnailAtTime(pickedVideo.uri, timeSec);
          }
        }}
      />

      {/* MODAL PLAYER VIDEO IN-APP */}
      <VideoPlayerModal
        video={playingVideo}
        visible={!!playingVideo}
        onClose={() => setPlayingVideo(null)}
      />

      {/* MODAL / CARD CONFERMA ELIMINAZIONE DEDICATA (GRUPPI E VIDEO) */}
      <Modal
        visible={confirmDeleteModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!confirmDeleteModal.isDeleting) {
            setConfirmDeleteModal({ visible: false, tipo: null, item: null, isDeleting: false });
          }
        }}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-[#18181C] border border-borderDark/80 w-full max-w-sm rounded-3xl p-6 shadow-2xl items-center">
            {/* Icona Cestino in Badge Rosso/Rosa */}
            <View className="w-14 h-14 rounded-2xl bg-accentPink/15 border border-accentPink/30 justify-center items-center mb-4">
              <Ionicons name="trash-outline" size={28} color="#FF3B5C" />
            </View>

            {/* Titolo */}
            <Text className="text-lg font-bold text-white text-center mb-2">
              {confirmDeleteModal.tipo === 'gruppo' ? 'Elimina Gruppo' : 'Elimina Video'}
            </Text>

            {/* Descrizione / Messaggio informativo */}
            <Text className="text-zinc-400 text-sm text-center leading-relaxed mb-6">
              {confirmDeleteModal.tipo === 'gruppo' ? (
                <>
                  Sei sicuro di voler eliminare il gruppo{'\n'}
                  <Text className="text-white font-semibold">"{confirmDeleteModal.item?.nome}"</Text>?
                  {'\n\n'}
                  <Text className="text-zinc-500 text-xs">
                    I video contenuti non verranno cancellati, ma spostati nella sezione "Senza gruppo".
                  </Text>
                </>
              ) : (
                <>
                  Sei sicuro di voler eliminare il video{'\n'}
                  <Text className="text-white font-semibold">"{confirmDeleteModal.item?.nome}"</Text>?
                  {'\n\n'}
                  <Text className="text-zinc-500 text-xs">
                    Questa operazione è irreversibile e rimuoverà definitivamente il file.
                  </Text>
                </>
              )}
            </Text>

            {/* Azioni: Annulla ed Elimina */}
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 bg-inputDark border border-inputBorder h-12 rounded-xl justify-center items-center"
                activeOpacity={0.8}
                disabled={confirmDeleteModal.isDeleting}
                onPress={() =>
                  setConfirmDeleteModal({ visible: false, tipo: null, item: null, isDeleting: false })
                }
              >
                <Text className="text-zinc-300 font-bold text-sm">Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-accentPink h-12 rounded-xl justify-center items-center shadow-lg shadow-accentPink/20 flex-row gap-2"
                activeOpacity={0.8}
                disabled={confirmDeleteModal.isDeleting}
                onPress={
                  confirmDeleteModal.tipo === 'gruppo'
                    ? eseguiEliminazioneGruppo
                    : eseguiEliminazioneVideo
                }
              >
                {confirmDeleteModal.isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm">Elimina</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
