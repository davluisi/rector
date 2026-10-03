import React, { useState, useRef, useEffect } from 'react';
import { View, Text, PanResponder } from 'react-native';

const MIN_AGE = 18;
const MAX_AGE = 100;
const THUMB_RADIUS = 13;

export default function AgeRangeSlider({
  minVal = MIN_AGE,
  maxVal = MAX_AGE,
  onChange,
}) {
  const [sliderWidth, setSliderWidth] = useState(250);
  const [localMin, setLocalMin] = useState(minVal);
  const [localMax, setLocalMax] = useState(maxVal);

  const sliderWidthRef = useRef(250);
  sliderWidthRef.current = sliderWidth;

  const localMinRef = useRef(localMin);
  localMinRef.current = localMin;

  const localMaxRef = useRef(localMax);
  localMaxRef.current = localMax;

  const dragStartXRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalMin(minVal);
      setLocalMax(maxVal);
    }
  }, [minVal, maxVal]);

  const valueToPos = (val, width) => {
    const range = MAX_AGE - MIN_AGE;
    const clamped = Math.max(MIN_AGE, Math.min(MAX_AGE, val));
    return ((clamped - MIN_AGE) / range) * width;
  };

  const posToValue = (x, width) => {
    const range = MAX_AGE - MIN_AGE;
    const clampedX = Math.max(0, Math.min(width, x));
    return Math.round(MIN_AGE + (clampedX / width) * range);
  };

  // PanResponder per il cursore MIN
  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        dragStartXRef.current = valueToPos(localMinRef.current, sliderWidthRef.current);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentX = dragStartXRef.current + gestureState.dx;
        let newVal = posToValue(currentX, sliderWidthRef.current);
        if (newVal > localMaxRef.current - 1) {
          newVal = localMaxRef.current - 1;
        }
        if (newVal < MIN_AGE) newVal = MIN_AGE;
        if (newVal !== localMinRef.current) {
          setLocalMin(newVal);
          onChange(newVal, localMaxRef.current);
        }
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        onChange(localMinRef.current, localMaxRef.current);
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
      },
    })
  ).current;

  // PanResponder per il cursore MAX
  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        dragStartXRef.current = valueToPos(localMaxRef.current, sliderWidthRef.current);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentX = dragStartXRef.current + gestureState.dx;
        let newVal = posToValue(currentX, sliderWidthRef.current);
        if (newVal < localMinRef.current + 1) {
          newVal = localMinRef.current + 1;
        }
        if (newVal > MAX_AGE) newVal = MAX_AGE;
        if (newVal !== localMaxRef.current) {
          setLocalMax(newVal);
          onChange(localMinRef.current, newVal);
        }
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        onChange(localMinRef.current, localMaxRef.current);
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
      },
    })
  ).current;

  const minPos = valueToPos(localMin, sliderWidth);
  const maxPos = valueToPos(localMax, sliderWidth);

  return (
    <View className="w-full py-2">
      {/* Badge sola lettura per Min e Max (solo numero, senza scritta "anni") */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="bg-[#1C1C22] border border-[#2A2A34] px-4 py-2 rounded-xl min-w-[70px]">
          <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-0.5">Min</Text>
          <Text className="text-[#FEB32F] text-lg font-black">{localMin}</Text>
        </View>

        <View className="h-[1px] w-8 bg-[#2A2A34]" />

        <View className="bg-[#1C1C22] border border-[#2A2A34] px-4 py-2 rounded-xl min-w-[70px] items-end">
          <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-0.5">Max</Text>
          <Text className="text-[#FEB32F] text-lg font-black">{localMax}</Text>
        </View>
      </View>

      {/* Track & Thumbs */}
      <View
        className="h-8 justify-center relative"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== sliderWidth) {
            setSliderWidth(w);
          }
        }}
      >
        {/* Sfondo inattivo della barra (18 -> 100) */}
        <View className="h-2 bg-[#22222A] rounded-full w-full" />

        {/* Tratto attivo evidenziato tra Min e Max */}
        <View
          className="h-2 bg-[#FEB32F] rounded-full absolute"
          style={{
            left: minPos,
            width: Math.max(0, maxPos - minPos),
          }}
        />

        {/* Cursore Minimo */}
        <View
          {...minPanResponder.panHandlers}
          style={{
            position: 'absolute',
            left: minPos - THUMB_RADIUS,
            width: THUMB_RADIUS * 2,
            height: THUMB_RADIUS * 2,
            borderRadius: THUMB_RADIUS,
            backgroundColor: '#FEB32F',
            borderWidth: 3,
            borderColor: '#121216',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
            elevation: 4,
          }}
        />

        {/* Cursore Massimo */}
        <View
          {...maxPanResponder.panHandlers}
          style={{
            position: 'absolute',
            left: maxPos - THUMB_RADIUS,
            width: THUMB_RADIUS * 2,
            height: THUMB_RADIUS * 2,
            borderRadius: THUMB_RADIUS,
            backgroundColor: '#FEB32F',
            borderWidth: 3,
            borderColor: '#121216',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
            elevation: 4,
          }}
        />
      </View>

      {/* Riferimento estremi della barra */}
      <View className="flex-row justify-between items-center mt-2 px-0.5">
        <Text className="text-zinc-600 text-xs font-semibold">18</Text>
        <Text className="text-zinc-600 text-xs font-semibold">100</Text>
      </View>
    </View>
  );
}
