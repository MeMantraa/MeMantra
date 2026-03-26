import React, { useState, useRef, useEffect } from 'react';
import { TextInput, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import AppTextInput from './textInputWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  onIconPress?: () => void;
  compact?: boolean;
};

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  onIconPress,
  compact = false,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const collapsedSize = compact ? 54 : 48;
  const collapsedIconSize = 28;
  const animatedWidth = useRef(new Animated.Value(collapsedSize)).current;
  const inputRef = useRef<TextInput>(null);

  //expand/collapse animation
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isExpanded ? SCREEN_WIDTH - 95 : collapsedSize,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      if (isExpanded) {
        inputRef.current?.focus();
      }
    });
  }, [isExpanded, animatedWidth, collapsedSize]);

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
      onSearch('');
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
        height: collapsedSize,
        backgroundColor: colors.secondary,
        borderRadius: collapsedSize / 2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: isExpanded ? 12 : (collapsedSize - collapsedIconSize) / 2,
        overflow: 'hidden',
        borderWidth: compact ? 1 : 0,
        borderColor: compact ? colors.secondary + 'cc' : 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: compact ? 0.12 : 0.08,
        shadowRadius: 8,
        elevation: compact ? 3 : 2,
      }}
    >
      <TouchableOpacity
        testID="search-toggle-button"
        onPress={onIconPress ?? (isExpanded ? handleSubmit : handleToggle)}
        className="items-center justify-center"
        style={{ width: collapsedIconSize, height: collapsedIconSize }}
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
              backgroundColor: 'transparent',
              paddingVertical: 12,
              paddingHorizontal: 0,
              height: collapsedSize,
              lineHeight: 20,
              borderWidth: 0,
              borderRadius: 0,
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
