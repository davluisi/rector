import React, { useState, useRef } from 'react';
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
  PanResponder
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import HeroSection from './components/HeroSection';
import SearchBar from './components/SearchBar';
import FilterSelector from './components/FilterSelector';
import TrainerCard from './components/TrainerCard';
import AuthModal from './components/AuthModal';

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

export default function App() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tutti');
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  // Dropdown Menu popup animation state
  const [menuRendered, setMenuRendered] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current; // starts offscreen to the right

  // PanResponder to handle swiping the menu to the right to close it
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Intercept movement if swiping to the right and movement is horizontal
        return gestureState.dx > 10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80 || gestureState.vx > 0.5) {
          setMenuVisible(false);
          Animated.timing(slideAnim, {
            toValue: 300,
            duration: 180,
            useNativeDriver: true,
          }).start(() => setMenuRendered(false));
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    })
  ).current;

  const filters = ['Tutti', 'Bodybuilding', 'Dimagrimento', 'Funzionale', 'Pilates'];

  const toggleMenu = () => {
    if (menuVisible) {
      setMenuVisible(false);
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setMenuRendered(false));
    } else {
      setMenuRendered(true);
      setMenuVisible(true);
      // Slide in animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    // Perform logout
    setCurrentUser(null);
    setMenuVisible(false);
    setMenuRendered(false);
    slideAnim.setValue(300);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-premiumDark">
        <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#1A1A1E] z-50">
        <Image
          source={require('./assets/logo.png')}
          className="h-12 w-[150px]"
          resizeMode="contain"
        />

        {/* Profile Button Section */}
        <View className="flex-row items-center">
          {currentUser ? (
            // Pill button when user is logged in
            <TouchableOpacity 
              className={`flex-row items-center bg-[#1E1E24] pl-4 pr-1 h-12 rounded-full border ${
                menuVisible ? 'border-accentCyan bg-[#24242C]' : 'border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={toggleMenu}
            >
              <Text className="text-white text-sm font-semibold mr-2">{currentUser.nome}</Text>
              <View className="w-10 h-10 rounded-full justify-center items-center">
                {currentUser.urlImmagineProfilo ? (
                  <Image source={{ uri: currentUser.urlImmagineProfilo }} className="w-full h-full rounded-full" />
                ) : (
                  <Ionicons name="person-circle-outline" size={34} color="#00F0FF" />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            // Default circular avatar button when user is not logged in
            <TouchableOpacity 
              className="items-center justify-center bg-[#1E1E24] w-12 h-12 rounded-full border border-[#303038]" 
              activeOpacity={0.7}
              onPress={() => {
                setAuthMode('login');
                setAuthModalVisible(true);
              }}
            >
              <View className="w-10 h-10 rounded-full justify-center items-center">
                <Ionicons name="person-circle-outline" size={34} color="#00F0FF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dropdown Menu Popup (Absolutely Positioned) */}
      {menuRendered && (
        <Animated.View 
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateX: slideAnim }],
            position: 'absolute',
            top: Platform.OS === 'android' ? 66 + (RNStatusBar.currentHeight || 0) : 66,
            right: 20,
            zIndex: 999,
          }}
          className="bg-cardDark border border-borderDark rounded-2xl p-5 w-64 shadow-2xl"
        >
          {/* User Full Name Info */}
          <View className="mb-4 pb-4 border-b border-borderDark">
            <Text className="text-white font-bold text-lg">{currentUser?.nome} {currentUser?.cognome}</Text>
            <Text className="text-zinc-400 text-sm mt-1">{currentUser?.email}</Text>
          </View>

          {/* Action: Modifica Profilo */}
          <TouchableOpacity 
            className="flex-row items-center gap-3 py-3"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color="#00F0FF" />
            <Text className="text-zinc-300 text-base font-semibold">Modifica profilo</Text>
          </TouchableOpacity>

          {/* Action: Logout */}
          <TouchableOpacity 
            className="flex-row items-center gap-3 py-3 border-t border-borderDark mt-2"
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#FF2E93" />
            <Text className="text-accentPink text-base font-bold">Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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

        {/* Bottom Promo Card */}
        <View className="bg-[#1E1B29] mx-5 mt-6 rounded-2xl p-5 border border-[#3B2F52] items-center">
          <Text className="text-lg font-extrabold text-white mb-1.5">Sei un Personal Trainer?</Text>
          <Text className="text-xs text-[#B4B0C4] text-center leading-[18px] mb-4">
            Unisciti a MondoPT per ampliare la tua clientela e gestire il tuo business.
          </Text>
          <TouchableOpacity className="bg-white py-2.5 px-5 rounded-lg">
            <Text className="text-[#1E1B29] text-sm font-bold">Inizia Ora</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Auth Modal Popup */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        mode={authMode}
        setMode={setAuthMode}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}
