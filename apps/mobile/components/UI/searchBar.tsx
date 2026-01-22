import React, { useState, useRef, useEffect } from 'react';
import { TextInput, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import AppTextInput from './textInputWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Search...' }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const animatedWidth = useRef(new Animated.Value(48)).current;
  const inputRef = useRef<TextInput>(null);

  //expand/collapse animation
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isExpanded ? SCREEN_WIDTH - 95 : 48,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      if (isExpanded) {
        inputRef.current?.focus();
      }
    });
  }, [isExpanded, animatedWidth]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const delayDebounce = setTimeout(() => {
      onSearch(searchQuery.trim());
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, onSearch]);

  const handleToggle = () => {
    if (isExpanded) {
      setSearchQuery('');
      inputRef.current?.blur();
    }
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <Animated.View
      style={{
        width: animatedWidth,
        height: 48,
        backgroundColor: colors.secondary,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        testID="search-toggle-button"
        onPress={isExpanded ? handleSubmit : handleToggle}
        className="items-center justify-center"
        style={{ width: 24, height: 24 }}
      >
        <Ionicons name="search-outline" size={24} color={colors.primaryDark} />
      </TouchableOpacity>

      {isExpanded && (
        <>
          <AppTextInput
            testID="search-input"
            ref={inputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor={colors.primaryDark}
            style={{
              color: colors.primaryDark,
              paddingVertical: 12,
              paddingHorizontal: 0,
              height: 48,
              lineHeight: 20,
            }}
            className="flex-1 ml-2 text-base"
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            testID="search-close-button"
            onPress={handleToggle}
            className="items-center justify-center ml-2"
            style={{ width: 24, height: 24 }}
          >
            <Ionicons name="close" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
};

export default SearchBar;
