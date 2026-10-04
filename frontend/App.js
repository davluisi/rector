import React, { useState, useEffect } from 'react';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Text,
  Platform,
  StatusBar as RNStatusBar,
  Keyboard
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import HomeScreen from './components/HomeScreen';
import SearchBar from './components/SearchBar';
import FilterSelector from './components/FilterSelector';
import TrainerCard from './components/TrainerCard';
import AuthScreen from './components/AuthScreen';
import ProfileScreen from './components/ProfileScreen';
import { detectActiveApiUrl } from './config';

// Personal Trainers list (currently empty, ready for backend integration)
const TRAINERS = [];

function MainContent() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('home');
  const [homeRoleTab, setHomeRoleTab] = useState('pt'); // 'pt' | 'atleta' per utenti con ruolo 'entrambi'

  useEffect(() => {
    detectActiveApiUrl();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const [selectedPt, setSelectedPt] = useState(null); // { id, nome, cognome, ... } per la vista di dettaglio PT
  const [selectedAbbonamentoPt, setSelectedAbbonamentoPt] = useState(null); // { id, nome, ... } per la vista Gestione Abbonamento

  const hasEntrambiRuoli = currentUser?.ruolo === 'entrambi';

  return (
    <View 
      className="flex-1 bg-premiumDark"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}
    >
      <StatusBar style="light" />

      {/* Area Contenuto Principale */}
      <View style={{ flex: 1 }}>
        {/* Schermata Home */}
        {activeTab === 'home' && (
          <View style={{ flex: 1 }} className="bg-premiumDark">
            {/* Header dinamico della Home: se siamo in gestione abbonamento, dettaglio PT o vista standard con logo Rector */}
            {selectedAbbonamentoPt ? (
              <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
                <TouchableOpacity
                  onPress={() => setSelectedAbbonamentoPt(null)}
                  className="w-10 h-10 rounded-full bg-[#18181C] items-center justify-center border border-[#282830]"
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-1 items-center px-2">
                  <Text className="text-lg font-bold text-white tracking-tight" numberOfLines={1}>
                    Abbonamento
                  </Text>
                </View>

                <View className="w-10 h-10" />
              </View>
            ) : selectedPt ? (
              <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
                <TouchableOpacity
                  onPress={() => setSelectedPt(null)}
                  className="w-10 h-10 rounded-full bg-[#18181C] items-center justify-center border border-[#282830]"
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-1 items-center px-2">
                  <Text className="text-lg font-bold text-white tracking-tight" numberOfLines={1}>
                    {selectedPt.nome ? `${selectedPt.nome} ${selectedPt.cognome || ''}`.trim() : 'Dettagli PT'}
                  </Text>
                </View>

                <View className="w-10 h-10" />
              </View>
            ) : (
              /* Header standard con Logo Rector (centrato in modo assoluto) e tab del browser per ruolo 'entrambi' */
              <View className="relative flex-row items-end justify-between px-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
                {/* Logo Rector sempre al centro perfetto dello schermo */}
                <View 
                  pointerEvents="none" 
                  className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center z-0"
                >
                  <Image
                    source={require('./assets/logo-rector-no-sfonfo.png')}
                    className="h-[52px] w-60"
                    resizeMode="contain"
                  />
                </View>

                {/* Tab PT a sinistra */}
                {hasEntrambiRuoli ? (
                  <TouchableOpacity
                    onPress={() => setHomeRoleTab('pt')}
                    activeOpacity={0.8}
                    style={{ marginBottom: -1 }}
                    className={`h-11 px-4 rounded-t-xl justify-center items-center z-10 ${
                      homeRoleTab === 'pt'
                        ? 'bg-[#18181D] border-t-2 border-l border-r border-[#A0132C] border-l-[#2A2A32] border-r-[#2A2A32]'
                        : 'bg-[#121216]/60 border-t border-l border-r border-[#222228] opacity-60'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        homeRoleTab === 'pt' ? 'text-[#FEB32F]' : 'text-zinc-400'
                      }`}
                    >
                      PT
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                {/* Tab Atleta a destra */}
                {hasEntrambiRuoli ? (
                  <TouchableOpacity
                    onPress={() => setHomeRoleTab('atleta')}
                    activeOpacity={0.8}
                    style={{ marginBottom: -1 }}
                    className={`h-11 px-4 rounded-t-xl justify-center items-center z-10 ${
                      homeRoleTab === 'atleta'
                        ? 'bg-[#18181D] border-t-2 border-l border-r border-[#A0132C] border-l-[#2A2A32] border-r-[#2A2A32]'
                        : 'bg-[#121216]/60 border-t border-l border-r border-[#222228] opacity-60'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        homeRoleTab === 'atleta' ? 'text-[#FEB32F]' : 'text-zinc-400'
                      }`}
                    >
                      Atleta
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
              </View>
            )}

            <HomeScreen 
              key={currentUser ? `user-${currentUser.id}-${currentUser.ruolo}-${homeRoleTab}` : 'guest'}
              user={currentUser} 
              activeHomeRole={hasEntrambiRuoli ? homeRoleTab : null}
              selectedPt={selectedPt}
              onSelectPt={setSelectedPt}
              selectedAbbonamentoPt={selectedAbbonamentoPt}
              onSelectAbbonamentoPt={setSelectedAbbonamentoPt}
              onNavigateWorkout={() => setActiveTab('workout')}
              onNavigateProfile={() => setActiveTab('profile')}
              onUpdateUser={setCurrentUser}
            />
          </View>
        )}

        {/* Schermata Schede Allenamento */}
        {activeTab === 'workout' && (
          <View style={{ flex: 1 }} className="bg-premiumDark">
            {/* Header locale per Allenamenti */}
            <View className="flex-row items-center justify-center py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
              <Text className="text-lg font-bold text-white tracking-tight">Scheda di Allenamento</Text>
            </View>

            <View className="flex-1 justify-center items-center px-6">
              <Ionicons name="reader-outline" size={64} color="#303038" className="mb-4" />
              <Text className="text-zinc-500 font-bold text-lg text-center">Scheda di Allenamento</Text>
              <Text className="text-zinc-600 text-sm text-center mt-1">Nessuna scheda caricata per il momento.</Text>
            </View>
          </View>
        )}

        {/* Auth / Profile Screen */}
        {activeTab === 'profile' && (
          <View style={{ flex: 1 }}>
            {currentUser ? (
              <ProfileScreen
                user={currentUser}
                onLogout={handleLogout}
                onUpdateUser={setCurrentUser}
              />
            ) : (
              <AuthScreen
                visible={activeTab === 'profile'}
                onClose={() => setActiveTab('home')}
                mode={authMode}
                setMode={setAuthMode}
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View className="flex-row items-center justify-around py-2 bg-[#121216] border-t border-[#1F1F24] px-6 z-40">
        {/* Workout/Scheda tab */}
        <TouchableOpacity 
          className="items-center justify-center p-1.5" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('workout');
          }}
        >
          <Ionicons name={activeTab === 'workout' ? "reader" : "reader-outline"} size={26} color={activeTab === 'workout' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* Home tab */}
        <TouchableOpacity 
          className="items-center justify-center p-1.5" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('home');
          }}
        >
          <Ionicons name={activeTab === 'home' ? "home" : "home-outline"} size={26} color={activeTab === 'home' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* User profile tab */}
        <View>
          {currentUser ? (
            <TouchableOpacity 
              className={`w-9 h-9 rounded-full justify-center items-center overflow-hidden ${
                activeTab === 'profile' ? 'border-2 border-white bg-[#24242C]' : 'border border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab('profile');
              }}
            >
              {currentUser.urlImmagineProfilo ? (
                <Image source={{ uri: currentUser.urlImmagineProfilo }} className="w-full h-full" />
              ) : (
                <Ionicons name="person-outline" size={20} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className={`w-9 h-9 rounded-full justify-center items-center bg-[#1E1E24] ${
                activeTab === 'profile' ? 'border-2 border-white' : 'border border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab('profile');
              }}
            >
              <Ionicons name="person-outline" size={20} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainContent />
    </SafeAreaProvider>
  );
}
