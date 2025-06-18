import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryDropdownProps {
  visible: boolean;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCustomPress: () => void;
}

const categories = [
  { key: 'streaming', label: 'Streaming', icon: 'play' },
  { key: 'education', label: 'Education', icon: 'school' },
  { key: 'music', label: 'Music', icon: 'musical-notes' },
  { key: 'news', label: 'News', icon: 'newspaper' },
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'fitness', label: 'Health/fitness', icon: 'fitness' },
];

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  visible,
  selectedCategory,
  onSelectCategory,
  onCustomPress,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.dropdown}>
      <Text style={styles.header}>Suggested</Text>
      <View style={styles.categoriesContainer}>
        {categories.map(category => (
          <Pressable
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonSelected
            ]}
            onPress={() => onSelectCategory(category.key)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.key ? '#fff' : '#5E5AEF'}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.key && styles.categoryTextSelected
            ]}>
              {category.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.customContainer}>
        <Text style={styles.customPrompt}>Don't see what you're looking for?</Text>
        <Pressable style={styles.customButton} onPress={onCustomPress}>
          <Text style={styles.customButtonText}>Custom</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    top: 52, // Changed from 200 to 52 to position right below the input
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    padding: 16,
    elevation: 10,
    maxHeight: 300,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#5E5AEF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  categoryButtonSelected: {
    backgroundColor: '#5E5AEF',
    borderColor: '#5E5AEF',
  },
  categoryText: {
    color: '#5E5AEF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: 'white',
  },
  customContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  customPrompt: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  customButton: {
    backgroundColor: '#5E5AEF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  customButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default CategoryDropdown;