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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
        player.replaceAsync(video.urlVideo).then(() => player.play()).catch(() => {});
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
  const [nomeVideoInput, setNomeVideoInput] = useState('');
  const [selectedGruppoForVideo, setSelectedGruppoForVideo] = useState(null);
  const [pickedVideo, setPickedVideo] = useState(null); // { uri, name, type }
  const [videoInModifica, setVideoInModifica] = useState(null); // null = upload nuovo, oggetto = modifica nome/gruppo

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleEliminaGruppo = async (gruppo) => {
    Alert.alert(
      'Elimina Gruppo',
      `Sei sicuro di voler eliminare il gruppo "${gruppo.nome}"? I video contenuti non verranno cancellati ma spostati tra i video senza gruppo.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${getApiUrl()}/api/archivio/gruppi/${gruppo.id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                if (currentFolder && currentFolder.id === gruppo.id) {
                  setCurrentFolder(null);
                }
                loadData();
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
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

      setPickedVideo({
        uri: asset.uri,
        name: filename,
        type: mimeType,
      });

      // Se il nome non è ancora inserito, suggerisci il nome del file senza estensione
      if (!nomeVideoInput.trim()) {
        const defaultName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setNomeVideoInput(defaultName);
      }
    }
  };

  // Upload video su S3 e salvataggio nell'archivio
  const handleSalvaVideo = async () => {
    if (!nomeVideoInput.trim()) {
      setErrorMessage('Inserisci il nome dell\'esercizio');
      return;
    }

    setErrorMessage('');

    // Se stiamo modificando un video esistente (nome o gruppo)
    if (videoInModifica) {
      try {
        setIsUploading(true);
        const res = await fetch(`${getApiUrl()}/api/archivio/video/${videoInModifica.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: nomeVideoInput.trim(),
            idGruppo: selectedGruppoForVideo,
          }),
        });

        if (res.ok) {
          setModalVideoVisible(false);
          setVideoInModifica(null);
          setNomeVideoInput('');
          setPickedVideo(null);
          setSelectedGruppoForVideo(null);
          loadData();
        } else {
          const err = await res.json();
          setErrorMessage(err.errore || 'Errore nel salvataggio');
        }
      } catch (e) {
        setErrorMessage('Errore di connessione al server');
      } finally {
        setIsUploading(false);
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

      setUploadStatus('Registrazione video nell\'archivio...');

      // Salva nel database
      const saveRes = await fetch(`${getApiUrl()}/api/archivio/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPt: user.id,
          nome: nomeVideoInput.trim(),
          urlVideo: uploadedUrl,
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
    Alert.alert(
      'Elimina Video',
      `Sei sicuro di voler eliminare il video "${video.nome}"? L'operazione è irreversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${getApiUrl()}/api/archivio/video/${video.id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                loadData();
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
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
        <View className="flex-1 items-center px-2">
          <Text className="text-lg font-bold text-white tracking-tight" numberOfLines={1}>
            {currentFolder ? currentFolder.nome : 'Archivio Esercizi'}
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 justify-center items-center rounded-xl bg-accentCyan/10 border border-accentCyan/30"
          activeOpacity={0.7}
          onPress={() => {
            setVideoInModifica(null);
            setNomeVideoInput('');
            setPickedVideo(null);
            setSelectedGruppoForVideo(
              currentFolder && currentFolder.type !== 'UNGROUPED' ? currentFolder.id : null
            );
            setErrorMessage('');
            setModalVideoVisible(true);
          }}
        >
          <Ionicons name="add" size={22} color="#00D2FF" />
        </TouchableOpacity>
      </View>

      {/* Percorso Explorer (Breadcrumb / Path) */}
      <View className="flex-row items-center px-5 py-2.5 bg-[#141418] border-b border-borderDark/40">
        <TouchableOpacity
          className="flex-row items-center"
          activeOpacity={0.7}
          onPress={() => setCurrentFolder(null)}
        >
          <Ionicons name="desktop-outline" size={14} color={currentFolder ? "#A1A1AA" : "#00D2FF"} />
          <Text className={`text-xs font-bold ml-1.5 ${currentFolder ? "text-zinc-400" : "text-accentCyan"}`}>
            Archivio
          </Text>
        </TouchableOpacity>
        {currentFolder && (
          <View className="flex-row items-center">
            <Ionicons name="chevron-forward" size={14} color="#71717A" className="mx-1" />
            <Ionicons
              name={currentFolder.type === 'UNGROUPED' ? "folder-open-outline" : "folder"}
              size={14}
              color={currentFolder.type === 'UNGROUPED' ? "#A1A1AA" : "#FEB32F"}
            />
            <Text className="text-white text-xs font-bold ml-1.5" numberOfLines={1}>
              {currentFolder.nome}
            </Text>
          </View>
        )}
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
              {/* Header Sezione Cartelle + Pulsante Nuova Cartella */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  Cartelle ({gruppi.length + 1})
                </Text>
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
                  <Text className="text-zinc-300 text-xs font-bold">Nuovo Gruppo</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                {/* 1. Cartella dei video senza gruppo assegnato: "Nessun gruppo" */}
                <TouchableOpacity
                  className="bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-row items-center justify-between"
                  activeOpacity={0.7}
                  onPress={() =>
                    setCurrentFolder({
                      type: 'UNGROUPED',
                      id: null,
                      nome: 'Nessun gruppo',
                    })
                  }
                >
                  <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                    <View className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-borderDark justify-center items-center">
                      <Ionicons name="folder-open-outline" size={24} color="#A1A1AA" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-[15px] font-bold">Nessun gruppo</Text>
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
                    <View className="flex-row items-center gap-1">
                      <TouchableOpacity
                        className="w-9 h-9 justify-center items-center rounded-xl bg-[#1E1E24] border border-borderDark/50"
                        activeOpacity={0.7}
                        onPress={() => {
                          setGruppoInModifica(g);
                          setNomeGruppoInput(g.nome);
                          setErrorMessage('');
                          setModalGruppoVisible(true);
                        }}
                      >
                        <Ionicons name="pencil" size={14} color="#A1A1AA" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="w-9 h-9 justify-center items-center rounded-xl bg-accentPink/10 border border-accentPink/20 ml-1"
                        activeOpacity={0.7}
                        onPress={() => handleEliminaGruppo(g)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#A0132C" />
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
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <Ionicons
                    name={currentFolder.type === 'UNGROUPED' ? "folder-open-outline" : "folder"}
                    size={18}
                    color={currentFolder.type === 'UNGROUPED' ? "#A1A1AA" : "#FEB32F"}
                  />
                  <Text className="text-white text-base font-bold flex-1" numberOfLines={1}>
                    {currentFolder.nome} ({videosInCurrentFolder.length})
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 bg-accentCyan/15 px-3 py-1.5 rounded-xl border border-accentCyan/30"
                  activeOpacity={0.7}
                  onPress={() => {
                    setVideoInModifica(null);
                    setNomeVideoInput('');
                    setPickedVideo(null);
                    setSelectedGruppoForVideo(
                      currentFolder.type !== 'UNGROUPED' ? currentFolder.id : null
                    );
                    setErrorMessage('');
                    setModalVideoVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#00D2FF" />
                  <Text className="text-accentCyan text-xs font-bold">Carica Video</Text>
                </TouchableOpacity>
              </View>

              {videosInCurrentFolder.length === 0 ? (
                <View className="bg-[#16161A]/40 border border-borderDark/40 rounded-3xl p-8 items-center justify-center mt-2">
                  <Ionicons name="film-outline" size={48} color="#303038" className="mb-3" />
                  <Text className="text-zinc-400 font-bold text-sm text-center">
                    Nessun video presente in questa cartella
                  </Text>
                  <Text className="text-zinc-600 text-xs text-center mt-1 mb-5">
                    Tocca il pulsante qui sotto per aggiungere il tuo primo esercizio.
                  </Text>
                  <TouchableOpacity
                    className="bg-accentCyan/15 border border-accentCyan/40 px-5 py-2.5 rounded-xl flex-row items-center gap-2"
                    activeOpacity={0.8}
                    onPress={() => {
                      setVideoInModifica(null);
                      setNomeVideoInput('');
                      setPickedVideo(null);
                      setSelectedGruppoForVideo(
                        currentFolder.type !== 'UNGROUPED' ? currentFolder.id : null
                      );
                      setErrorMessage('');
                      setModalVideoVisible(true);
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={18} color="#00D2FF" />
                    <Text className="text-accentCyan text-xs font-bold">Carica Video Esercizio</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="gap-3">
                  {videosInCurrentFolder.map((video) => (
                    <View
                      key={video.id}
                      className="bg-[#16161A]/60 border border-borderDark/40 rounded-2xl p-4 flex-row items-center justify-between"
                    >
                      <TouchableOpacity
                        className="flex-1 flex-row items-center gap-3.5 mr-2"
                        activeOpacity={0.7}
                        onPress={() => handlePlayVideo(video)}
                      >
                        <View className="w-12 h-12 rounded-xl bg-accentCyan/10 border border-accentCyan/20 justify-center items-center">
                          <Ionicons name="play" size={22} color="#00D2FF" />
                        </View>
                        <View className="flex-1 pr-1">
                          <Text className="text-white text-[15px] font-bold leading-snug">
                            {video.nome}
                          </Text>
                          <View className="flex-row items-center flex-wrap gap-2 mt-1.5">
                            <Text className="text-zinc-500 text-[11px]">
                              {video.dataCaricamento
                                ? new Date(video.dataCaricamento).toLocaleDateString()
                                : ''}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Azioni Video: Modifica / Elimina */}
                      <View className="flex-row items-center gap-1">
                        <TouchableOpacity
                          className="w-9 h-9 justify-center items-center rounded-xl bg-[#1E1E24] border border-borderDark/50"
                          activeOpacity={0.7}
                          onPress={() => {
                            setVideoInModifica(video);
                            setNomeVideoInput(video.nome);
                            setSelectedGruppoForVideo(video.idGruppo || null);
                            setErrorMessage('');
                            setModalVideoVisible(true);
                          }}
                        >
                          <Ionicons name="pencil" size={14} color="#A1A1AA" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="w-9 h-9 justify-center items-center rounded-xl bg-accentPink/10 border border-accentPink/20 ml-1"
                          activeOpacity={0.7}
                          onPress={() => handleEliminaVideo(video)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#A0132C" />
                        </TouchableOpacity>
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

      {/* MODAL CARICAMENTO / MODIFICA VIDEO */}
      <Modal
        visible={modalVideoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isUploading && setModalVideoVisible(false)}
      >
        <View className="flex-1 bg-black/85 justify-end">
          <View className="bg-[#18181C] border-t border-borderDark rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-white">
                {videoInModifica ? 'Modifica Esercizio' : 'Carica Video Esercizio'}
              </Text>
              {!isUploading && (
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-[#24242B] justify-center items-center"
                  onPress={() => setModalVideoVisible(false)}
                >
                  <Ionicons name="close" size={18} color="#A1A1AA" />
                </TouchableOpacity>
              )}
            </View>

            {errorMessage ? (
              <View className="bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl mb-4">
                <Text className="text-red-500 text-xs font-semibold">{errorMessage}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Nome dell'esercizio */}
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                Nome Esercizio
              </Text>
              <TextInput
                className="bg-inputDark border border-inputBorder rounded-xl px-4 h-12 color-white text-[15px] focus:border-accentCyan mb-4"
                placeholder="es. Panca Piana con Bilanciere"
                placeholderTextColor="#52525B"
                value={nomeVideoInput}
                onChangeText={setNomeVideoInput}
                editable={!isUploading}
              />

              {/* Selettore Gruppo */}
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                Assegna a un Gruppo (Opzionale)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 -mx-1 px-1">
                <TouchableOpacity
                  className={`mr-2 px-3.5 py-2 rounded-xl border ${
                    selectedGruppoForVideo === null
                      ? 'bg-accentCyan/20 border-accentCyan'
                      : 'bg-inputDark border-borderDark/60'
                  }`}
                  activeOpacity={0.7}
                  onPress={() => setSelectedGruppoForVideo(null)}
                  disabled={isUploading}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedGruppoForVideo === null ? 'text-accentCyan' : 'text-zinc-400'
                    }`}
                  >
                    Nessun Gruppo
                  </Text>
                </TouchableOpacity>
                {gruppi.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    className={`mr-2 px-3.5 py-2 rounded-xl border ${
                      selectedGruppoForVideo === g.id
                        ? 'bg-[#FEB32F]/20 border-[#FEB32F]'
                        : 'bg-inputDark border-borderDark/60'
                    }`}
                    activeOpacity={0.7}
                    onPress={() => setSelectedGruppoForVideo(g.id)}
                    disabled={isUploading}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedGruppoForVideo === g.id ? 'text-[#FEB32F]' : 'text-zinc-300'
                      }`}
                    >
                      {g.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* File Video (solo se è un nuovo inserimento) */}
              {!videoInModifica && (
                <View className="mb-6">
                  <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                    File Video
                  </Text>
                  <TouchableOpacity
                    className={`border border-dashed rounded-2xl p-5 items-center justify-center ${
                      pickedVideo
                        ? 'bg-accentCyan/5 border-accentCyan/40'
                        : 'bg-inputDark/50 border-borderDark'
                    }`}
                    activeOpacity={0.8}
                    onPress={handlePickVideo}
                    disabled={isUploading}
                  >
                    <Ionicons
                      name={pickedVideo ? 'checkmark-circle' : 'cloud-upload-outline'}
                      size={32}
                      color={pickedVideo ? '#00D2FF' : '#71717A'}
                      className="mb-2"
                    />
                    <Text className="text-white text-xs font-bold text-center">
                      {pickedVideo ? pickedVideo.name : 'Seleziona un video dalla galleria'}
                    </Text>
                    <Text className="text-zinc-500 text-[11px] text-center mt-1">
                      {pickedVideo ? 'Tocca per cambiare video' : 'Formati consigliati: MP4, MOV'}
                    </Text>
                  </TouchableOpacity>
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
                className={`h-12 rounded-xl justify-center items-center shadow-lg ${
                  isUploading ? 'bg-zinc-700' : 'bg-white'
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
        </View>
      </Modal>

      {/* MODAL PLAYER VIDEO IN-APP */}
      <VideoPlayerModal
        video={playingVideo}
        visible={!!playingVideo}
        onClose={() => setPlayingVideo(null)}
      />
    </View>
  );
}
