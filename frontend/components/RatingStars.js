import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente per mostrare 5 stelle con supporto a riempimento parziale continuo o a decimali
 * (es. 4.3 -> 4 stelle piene e la 5a riempita per il 30%).
 * 
 * @param {number} rating - Media voto (es. 4.3)
 * @param {number} maxStars - Numero totale di stelle (default: 5)
 * @param {number} size - Dimensione dell'icona (default: 14)
 * @param {boolean} showValue - Mostra il valore numerico accanto (default: false)
 * @param {number} count - Conteggio totale recensioni opzionale
 */
export default function RatingStars({
  rating = 0,
  maxStars = 5,
  size = 14,
  showValue = false,
  count = null,
}) {
  const safeRating = Math.max(0, Math.min(Number(rating) || 0, maxStars));

  return (
    <View className="flex-row items-center gap-1">
      <View className="flex-row items-center">
        {Array.from({ length: maxStars }).map((_, index) => {
          // Calcola la percentuale di riempimento per la stella corrente (da 0 a 1)
          const fillPercentage = Math.max(0, Math.min(1, safeRating - index));

          return (
            <View
              key={index}
              style={{ width: size, height: size, marginRight: index < maxStars - 1 ? 2 : 0 }}
              className="relative justify-center items-center overflow-hidden"
            >
              {/* Stella vuota di sfondo */}
              <Ionicons
                name="star"
                size={size}
                color="#2A2A34"
                style={{ position: 'absolute', top: 0, left: 0 }}
              />

              {/* Porzione riempita in giallo */}
              {fillPercentage > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: size * fillPercentage,
                    height: size,
                    overflow: 'hidden',
                  }}
                >
                  <Ionicons
                    name="star"
                    size={size}
                    color="#FFB430"
                    style={{ position: 'absolute', top: 0, left: 0, width: size }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {showValue && (
        <View className="flex-row items-center ml-1">
          <Text className="text-zinc-200 text-xs font-bold">
            {safeRating > 0 ? safeRating.toFixed(1).replace('.', ',') : '0,0'}
          </Text>
          {count !== null && count !== undefined && (
            <Text className="text-zinc-500 text-[11px] ml-1">({count})</Text>
          )}
        </View>
      )}
    </View>
  );
}
