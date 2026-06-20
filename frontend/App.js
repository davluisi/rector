import React, { useState, useRef, useEffect } from 'react';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Text,
  Animated,
  Platform,
  StatusBar as RNStatusBar,
  PanResponder,
  Dimensions,
  Keyboard
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import HeroSection from './components/HeroSection';
import SearchBar from './components/SearchBar';
import FilterSelector from './components/FilterSelector';
import TrainerCard from './components/TrainerCard';
import AuthScreen from './components/AuthScreen';
import ProfileScreen from './components/ProfileScreen';

// Mock data for Personal Trainers
const TRAINERS = [
  {
    id: '1',
    name: 'Marco Rossi',
    specialties: ['Bodybuilding', 'Powerlifting'],
    rating: 4.9,
    reviews: 124,
    price: '40',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: '2',
    name: 'Elena Bianchi',
    specialties: ['Pilates', 'Dimagrimento', 'Yoga'],
    rating: 5.0,
    reviews: 98,
    price: '45',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: '3',
    name: 'Luca Moretti',
    specialties: ['Crossfit', 'Funzionale', 'Kettlebell'],
    rating: 4.8,
    reviews: 86,
    price: '35',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tutti');
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('world');
  
  // Independent Animated.Value offsets for each tab to enable clean transitions
  const barbellX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const worldX = useRef(new Animated.Value(0)).current; // starts at center (0)
  const profileX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const prevTabRef = useRef('world');

  useEffect(() => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = activeTab;

    // Direct transition between extreme tabs (barbell <-> profile):
    // Move the middle tab (world) offscreen immediately so it isn't seen passing through.
    if (prevTab === 'barbell' && activeTab === 'profile') {
      worldX.setValue(-SCREEN_WIDTH);
    } else if (prevTab === 'profile' && activeTab === 'barbell') {
      worldX.setValue(SCREEN_WIDTH);
    }

    // Set target positions
    let targetBarbell = -SCREEN_WIDTH;
    let targetWorld = 0;
    let targetProfile = SCREEN_WIDTH;

    if (activeTab === 'barbell') {
      targetBarbell = 0;
      targetWorld = SCREEN_WIDTH;
      targetProfile = SCREEN_WIDTH;
    } else if (activeTab === 'world') {
      targetBarbell = -SCREEN_WIDTH;
      targetWorld = 0;
      targetProfile = SCREEN_WIDTH;
    } else if (activeTab === 'profile') {
      targetBarbell = -SCREEN_WIDTH;
      targetWorld = -SCREEN_WIDTH;
      targetProfile = 0;
    }

    Animated.parallel([
      Animated.timing(barbellX, {
        toValue: targetBarbell,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(worldX, {
        toValue: targetWorld,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(profileX, {
        toValue: targetProfile,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  const barbellTranslateX = barbellX;
  const worldTranslateX = worldX;
  const profileTranslateX = profileX;

  const filters = ['Tutti', 'Bodybuilding', 'Dimagrimento', 'Funzionale', 'Pilates'];

  const handleLogout = () => {
    setCurrentUser(null);
  };



  return (
    <SafeAreaProvider>
      <SafeAreaView 
        className="flex-1 bg-premiumDark"
        onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}
      >
        <StatusBar style="light" />



      {/* Area Contenuto Principale */}
      <View 
        className="flex-1 relative"
      >
        

        {/* Schermata Home (World) */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: worldTranslateX }],
          }}
        >
          {/* Header locale per la Home */}
          <View className="flex-row items-center justify-center py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <Image
              source={require('./assets/logo.png')}
              className="h-10 w-[120px]"
              resizeMode="contain"
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {/* Hero Banner / Intro */}
            <HeroSection />

            {/* Search Bar */}
            <SearchBar value={search} onChangeText={setSearch} />

            {/* Quick Filters */}
            <FilterSelector
              filters={filters}
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
            />

            {/* Trainers Section Header */}
            <View className="flex-row justify-between items-center mx-5 mt-7 mb-4">
              <Text className="text-lg font-bold text-white">I migliori Professionisti</Text>
              <TouchableOpacity>
                <Text className="text-accentCyan text-sm font-semibold">Vedi tutti</Text>
              </TouchableOpacity>
            </View>

            {/* Trainer Cards */}
            {TRAINERS.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))}



          </ScrollView>
        </Animated.View>

        {/* Schermata Allenamenti (Barbell) */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: barbellTranslateX }],
          }}
          className="bg-premiumDark"
        >
          {/* Header locale per Allenamenti */}
          <View className="flex-row items-center justify-center py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
            <Text className="text-lg font-bold text-white tracking-tight">Allenamenti</Text>
          </View>

          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="barbell-outline" size={64} color="#303038" className="mb-4" />
            <Text className="text-zinc-500 font-bold text-lg text-center">Allenamenti</Text>
            <Text className="text-zinc-600 text-sm text-center mt-1">Nessuna scheda caricata per il momento.</Text>
          </View>
        </Animated.View>

        {/* Auth Screen (compresa tra topbar e bottombar) */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: profileTranslateX }],
          }}
        >
          {currentUser ? (
            <ProfileScreen
              user={currentUser}
              onLogout={handleLogout}
              onUpdateUser={setCurrentUser}
            />
          ) : (
            <AuthScreen
              visible={activeTab === 'profile'}
              onClose={() => setActiveTab('world')}
              mode={authMode}
              setMode={setAuthMode}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
              }}
            />
          )}
        </Animated.View>
      </View>

      {/* Bottom Navigation Bar */}
      <View className="flex-row items-center justify-around py-4 bg-[#121216] border-t border-[#1F1F24] px-6 z-40">
        {/* Barbell/Trainers tab */}
        <TouchableOpacity 
          className="items-center justify-center p-2" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('barbell');
          }}
        >
          <Ionicons name="barbell-outline" size={32} color={activeTab === 'barbell' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* Network/World tab */}
        <TouchableOpacity 
          className="items-center justify-center p-2" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('world');
          }}
        >
          <Ionicons name="earth-outline" size={32} color={activeTab === 'world' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* User profile tab */}
        <View>
          {currentUser ? (
            <TouchableOpacity 
              className={`w-11 h-11 rounded-full justify-center items-center overflow-hidden ${
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
                <Ionicons name="person-outline" size={24} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className={`w-11 h-11 rounded-full justify-center items-center bg-[#1E1E24] ${
                activeTab === 'profile' ? 'border-2 border-white' : 'border border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab('profile');
              }}
            >
              <Ionicons name="person-outline" size={24} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}
