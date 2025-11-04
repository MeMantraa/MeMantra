import React, { useState, useRef, useEffect } from 'react';
import { TextInput, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SearchBarProps = {
  onSearch?: (query: string) => void;
  placeholder?: string;
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Search...' }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const animatedWidth = useRef(new Animated.Value(48)).current;
  const inputRef = useRef<TextInput>(null);

  const expandSearchBar = () => {
    setIsExpanded(true);
    Animated.timing(animatedWidth, {
      toValue: SCREEN_WIDTH - 90, //TODO: adjust based on design
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      inputRef.current?.focus();
    });
  };

  const collapseSearchBar = () => {
    setIsExpanded(false);
    setSearchQuery('');
    Animated.timing(animatedWidth, {
      toValue: 48,
      duration: 200,
      useNativeDriver: false,
    }).start();
    inputRef.current?.blur();
  };

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  useEffect(() => {
    if (searchQuery.trim() && onSearch) {
      const delayDebounce = setTimeout(() => {
        onSearch(searchQuery.trim());
      }, 500);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, onSearch]);

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
        onPress={isExpanded ? handleSearch : expandSearchBar}
        className="items-center justify-center"
        style={{ width: 24, height: 24 }}
      >
        <Ionicons name="search-outline" size={24} color={colors.primaryDark} />
      </TouchableOpacity>

      {isExpanded && (
        <>
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor={colors.primaryDark}
            style={{
              color: colors.primaryDark,
              paddingVertical: 0,
              height: 48,
            }}
            className="flex-1 ml-2 text-base"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            textAlignVertical="center" // Android
          />
          <TouchableOpacity
            onPress={collapseSearchBar}
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
