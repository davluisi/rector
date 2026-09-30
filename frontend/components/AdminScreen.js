import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { File as ModernFile, Paths } from 'expo-file-system';
import { config } from '../config';

const getApiUrl = () => config.apiUrl;

export default function AdminScreen({ user, onBack }) {
  const [activeSubTab, setActiveSubTab] = useState('stats'); // 'stats' | 'verifiche'
  const [stats, setStats] = useState(null);
  const [ptRichieste, setPtRichieste] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [previewModal, setPreviewModal] = useState({ visible: false, uri: null, name: '' });

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/stats`, {
        headers: {
          'X-Admin-Id': String(user.id),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching admin stats:', e);
    }
  };

  const fetchPtRichieste = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/pt-richieste?soloInAttesa=false`, {
        headers: {
          'X-Admin-Id': String(user.id),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPtRichieste(data);
      }
    } catch (e) {
      console.error('Error fetching PT requests:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPtRichieste()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAggiornaStatoVerifica = async (idUtente, nuovoStato) => {
    try {
      setActionLoadingId(idUtente);
      const response = await fetch(`${getApiUrl()}/api/admin/pt/${idUtente}/stato-verifica`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Id': String(user.id),
        },
        body: JSON.stringify({ verificato: nuovoStato }),
      });

      if (response.ok) {
        // Refresh local lists
        await Promise.all([fetchStats(), fetchPtRichieste()]);
      } else {
        const err = await response.json();
        alert(err.errore || 'Operazione fallita');
      }
    } catch (e) {
      console.error(e);
      alert('Errore di connessione al server');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDocument = async (url, name) => {
    if (!url) return;
    const isImage = /\.(jpe?g|png|webp|gif|bmp)/i.test(name || '') || /\.(jpe?g|png|webp|gif|bmp)/i.test(url);

    if (isImage) {
      setPreviewModal({
        visible: true,
        uri: url,
        name: name || 'Documento',
      });
      return;
    }

    // PDF or external file download & open
    try {
      const fileExt = name ? name.split('.').pop() : 'pdf';
      const cleanName = `admin_doc_${Date.now()}.${fileExt}`;
      const targetUri = `${FileSystem.documentDirectory}${cleanName}`;

      const downloadResult = await FileSystem.downloadAsync(url, targetUri);

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf',
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Visualizza documento',
        });
      }
    } catch (e) {
      console.error(e);
      alert('Impossibile aprire il file');
    }
  };

  return (
    <View className="flex-1 bg-premiumDark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full bg-[#18181C] items-center justify-center border border-[#282830]"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10" />
        )}
        <View className="flex-row items-center gap-2">
          <Ionicons name="shield-checkmark" size={20} color="#FFB430" />
          <Text className="text-lg font-bold text-white tracking-tight">Pannello Admin</Text>
        </View>
        <TouchableOpacity
          onPress={loadData}
          className="w-10 h-10 rounded-full bg-[#18181C] items-center justify-center border border-[#282830]"
          activeOpacity={0.7}
        >
          <Ionicons name="reload-outline" size={18} color="#FFB430" />
        </TouchableOpacity>
      </View>

      {/* Tabs Switcher */}
      <View className="flex-row mx-5 my-4 p-1 bg-inputDark rounded-xl border border-inputBorder">
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg items-center ${activeSubTab === 'stats' ? 'bg-[#FFB430]' : ''}`}
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('stats')}
        >
          <Text className={`text-xs font-bold ${activeSubTab === 'stats' ? 'text-black' : 'text-zinc-400'}`}>
            Statistiche App
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center gap-1.5 ${activeSubTab === 'verifiche' ? 'bg-[#FFB430]' : ''}`}
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('verifiche')}
        >
          <Text className={`text-xs font-bold ${activeSubTab === 'verifiche' ? 'text-black' : 'text-zinc-400'}`}>
            Verifiche PT
          </Text>
          {stats && stats.ptInAttesa > 0 && (
            <View className={`px-1.5 py-0.2 rounded-full ${activeSubTab === 'verifiche' ? 'bg-black' : 'bg-red-500'}`}>
              <Text className={`text-[10px] font-black ${activeSubTab === 'verifiche' ? 'text-[#FFB430]' : 'text-white'}`}>
                {stats.ptInAttesa}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFB430" />
          <Text className="text-zinc-500 text-xs mt-3">Caricamento dati amministrativi...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {activeSubTab === 'stats' ? (
            <View className="px-5">
              {/* Money Section */}
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Finanze & Transazioni</Text>
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1 bg-cardDark border border-borderDark rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-zinc-500 text-xs font-bold uppercase">Volume Totale</Text>
                    <Ionicons name="cash-outline" size={18} color="#FFB430" />
                  </View>
                  <Text className="text-white text-2xl font-black">{stats ? stats.volumeTransato : '0.00'} €</Text>
                  <Text className="text-zinc-500 text-[11px] mt-1">Transato totale app</Text>
                </View>

                <View className="flex-1 bg-cardDark border border-borderDark rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-zinc-500 text-xs font-bold uppercase">Guadagno Rector</Text>
                    <Ionicons name="trending-up" size={18} color="#22C55E" />
                  </View>
                  <Text className="text-[#22C55E] text-2xl font-black">{stats ? stats.guadagnoPiattaforma : '0.00'} €</Text>
                  <Text className="text-zinc-500 text-[11px] mt-1">Commissioni nette</Text>
                </View>
              </View>

              {/* Users & Community Stats */}
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Utenti & Community</Text>
              <View className="bg-cardDark border border-borderDark rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between items-center py-2 border-b border-borderDark/60">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons name="people" size={18} color="#A1A1AA" />
                    <Text className="text-zinc-300 text-sm font-semibold">Utenti Registrati Totali</Text>
                  </View>
                  <Text className="text-white text-base font-bold">{stats ? stats.totaleUtenti : 0}</Text>
                </View>

                <View className="flex-row justify-between items-center py-2.5 border-b border-borderDark/60">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons name="barbell-outline" size={18} color="#A1A1AA" />
                    <Text className="text-zinc-300 text-sm font-semibold">Atleti Registrati</Text>
                  </View>
                  <Text className="text-white text-base font-bold">{stats ? stats.totaleAtleti : 0}</Text>
                </View>

                <View className="flex-row justify-between items-center py-2.5 border-b border-borderDark/60">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                    <Text className="text-zinc-300 text-sm font-semibold">Personal Trainer Verificati</Text>
                  </View>
                  <Text className="text-[#22C55E] text-base font-bold">{stats ? stats.ptVerificati : 0}</Text>
                </View>

                <View className="flex-row justify-between items-center py-2.5">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons name="alert-circle-outline" size={18} color="#FFB430" />
                    <Text className="text-zinc-300 text-sm font-semibold">PT in Attesa di Verifica</Text>
                  </View>
                  <Text className="text-[#FFB430] text-base font-bold">{stats ? stats.ptInAttesa : 0}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="px-5">
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
                Richieste di Registrazione PT ({ptRichieste.length})
              </Text>

              {ptRichieste.length === 0 ? (
                <View className="py-12 items-center justify-center">
                  <Ionicons name="document-text-outline" size={48} color="#303038" className="mb-2" />
                  <Text className="text-zinc-400 font-bold text-sm">Nessuna richiesta da gestire</Text>
                </View>
              ) : (
                ptRichieste.map((pt) => {
                  const isActionLoading = actionLoadingId === pt.idUtente;

                  return (
                    <View key={pt.idUtente} className="bg-cardDark border border-borderDark rounded-2xl p-4 mb-4">
                      {/* PT Card Top Header */}
                      <View className="flex-row items-center justify-between pb-3 border-b border-borderDark/60">
                        <View className="flex-row items-center gap-3">
                          {pt.urlImmagineProfilo ? (
                            <Image source={{ uri: pt.urlImmagineProfilo }} className="w-12 h-12 rounded-full" />
                          ) : (
                            <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center">
                              <Ionicons name="person" size={24} color="#71717A" />
                            </View>
                          )}
                          <View>
                            <Text className="text-white text-base font-bold">
                              {pt.nome} {pt.cognome}
                            </Text>
                            <Text className="text-zinc-400 text-xs">{pt.email}</Text>
                          </View>
                        </View>

                        <View className={`px-2.5 py-1 rounded-full ${pt.verificato ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                          <Text className={`text-[11px] font-bold ${pt.verificato ? 'text-green-400' : 'text-yellow-400'}`}>
                            {pt.verificato ? 'Verificato' : 'In attesa'}
                          </Text>
                        </View>
                      </View>

                      {/* Scadenza Documento */}
                      <View className="flex-row items-center justify-between py-2 border-b border-borderDark/60">
                        <Text className="text-zinc-400 text-xs font-semibold">Scadenza Documento:</Text>
                        <Text className="text-white text-xs font-bold">{pt.scadenzaDocumento || 'Non inserita'}</Text>
                      </View>

                      {/* Documenti ID */}
                      <View className="py-3 border-b border-borderDark/60">
                        <Text className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                          Documento d'identità
                        </Text>
                        <View className="flex-row gap-2">
                          {pt.documentoFronteUrl ? (
                            <TouchableOpacity
                              onPress={() => handleViewDocument(pt.documentoFronteUrl, 'Fronte_Documento')}
                              className="flex-1 bg-inputDark border border-inputBorder py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
                              activeOpacity={0.7}
                            >
                              <Ionicons name="document-attach" size={16} color="#FFB430" />
                              <Text className="text-white text-xs font-bold">Fronte</Text>
                            </TouchableOpacity>
                          ) : (
                            <View className="flex-1 bg-inputDark/50 py-2 px-3 rounded-xl items-center">
                              <Text className="text-zinc-600 text-xs">Fronte assente</Text>
                            </View>
                          )}

                          {pt.documentoRetroUrl ? (
                            <TouchableOpacity
                              onPress={() => handleViewDocument(pt.documentoRetroUrl, 'Retro_Documento')}
                              className="flex-1 bg-inputDark border border-inputBorder py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
                              activeOpacity={0.7}
                            >
                              <Ionicons name="document-attach" size={16} color="#FFB430" />
                              <Text className="text-white text-xs font-bold">Retro</Text>
                            </TouchableOpacity>
                          ) : (
                            <View className="flex-1 bg-inputDark/50 py-2 px-3 rounded-xl items-center">
                              <Text className="text-zinc-600 text-xs">Retro assente</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Certificazioni e Lauree */}
                      <View className="py-3">
                        <Text className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                          Certificazioni & Brevetti ({pt.certificazioni?.length || 0})
                        </Text>
                        {pt.certificazioni && pt.certificazioni.length > 0 ? (
                          pt.certificazioni.map((cert, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => handleViewDocument(cert.url, cert.name)}
                              className="bg-inputDark border border-inputBorder py-2 px-3 rounded-xl flex-row items-center justify-between mb-2"
                              activeOpacity={0.7}
                            >
                              <View className="flex-row items-center gap-2 flex-1 mr-2">
                                <Ionicons name="ribbon-outline" size={16} color="#FFB430" />
                                <Text className="text-white text-xs font-medium" numberOfLines={1}>
                                  {cert.name}
                                </Text>
                              </View>
                              <Ionicons name="eye-outline" size={16} color="#FFB430" />
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text className="text-zinc-600 text-xs italic">Nessun certificato allegato</Text>
                        )}
                      </View>

                      {/* Pulsanti Azione */}
                      <View className="flex-row gap-2 mt-2 pt-3 border-t border-borderDark/60">
                        {!pt.verificato ? (
                          <TouchableOpacity
                            onPress={() => handleAggiornaStatoVerifica(pt.idUtente, true)}
                            disabled={isActionLoading}
                            className="flex-1 bg-[#22C55E] py-3 rounded-xl items-center justify-center flex-row gap-2"
                            activeOpacity={0.8}
                          >
                            {isActionLoading ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                                <Text className="text-white text-xs font-bold uppercase tracking-wider">Approva PT</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleAggiornaStatoVerifica(pt.idUtente, false)}
                            disabled={isActionLoading}
                            className="flex-1 bg-red-600/80 py-3 rounded-xl items-center justify-center flex-row gap-2"
                            activeOpacity={0.8}
                          >
                            {isActionLoading ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                                <Text className="text-white text-xs font-bold uppercase tracking-wider">Revoca Verifica</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal anteprima immagini documenti */}
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
