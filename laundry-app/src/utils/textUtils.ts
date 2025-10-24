/**
 * Utility functions for text formatting and validation
 */

/**
 * Capitalizes the first letter of each word in a string
 * @param text - The text to capitalize
 * @returns The capitalized text
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return text;
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns The capitalized text
 */
export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formats a name (first name or last name) for database storage
 * @param name - The name to format
 * @returns The properly formatted name
 */
export const formatName = (name: string): string => {
  if (!name) return name;
  
  // Handle special cases like "Mc", "Mac", "O'", "De", etc.
  const specialPrefixes = ['mc', 'mac', 'o\'', 'de', 'van', 'von', 'del', 'della', 'di', 'da', 'du', 'le', 'la'];
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Check for special prefixes
      for (const prefix of specialPrefixes) {
        if (word.startsWith(prefix)) {
          return prefix.charAt(0).toUpperCase() + prefix.slice(1) + word.slice(prefix.length).charAt(0).toUpperCase() + word.slice(prefix.length + 1);
        }
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Formats location fields (city, state, street) for database storage
 * @param location - The location text to format
 * @returns The properly formatted location
 */
export const formatLocation = (location: string): string => {
  if (!location) return location;
  
  // Handle common location abbreviations and special cases
  const abbreviations: Record<string, string> = {
    'st': 'Street',
    'ave': 'Avenue',
    'rd': 'Road',
    'blvd': 'Boulevard',
    'dr': 'Drive',
    'ln': 'Lane',
    'ct': 'Court',
    'pl': 'Place',
    'n': 'North',
    's': 'South',
    'e': 'East',
    'w': 'West',
    'ne': 'Northeast',
    'nw': 'Northwest',
    'se': 'Southeast',
    'sw': 'Southwest',
  };
  
  return location
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Check for abbreviations
      const cleanWord = word.replace(/[.,]/g, '');
      if (abbreviations[cleanWord]) {
        return abbreviations[cleanWord] + word.slice(cleanWord.length);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Formats an address object for database storage
 * @param address - The address object to format
 * @returns The formatted address object
 */
export const formatAddress = (address: { [key: string]: any }): {
  // Ensuring all required properties of the Address type are returned
  street: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  instructions: string;
} => {
  return {
    street: address.street ? formatLocation(address.street) : '',
    city: address.city ? formatLocation(address.city) : '',
    state: address.state ? formatLocation(address.state) : '',
    zipCode: address.zipCode || '',
    type: (address.type as string)?.trim() || 'default', // Type assert and provide default
    instructions: (address.instructions as string)?.trim() || '', // Type assert and provide default
  };
};

/**
 * Formats user data for database storage
 * @param userData - The user data to format
 * @returns The formatted user data
 */
export const formatUserData = (userData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}): {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
} => {
  return {
    firstName: userData.firstName ? formatName(userData.firstName) : '',
    lastName: userData.lastName ? formatName(userData.lastName) : '',
    email: userData.email ? userData.email.toLowerCase() : '',
    phoneNumber: userData.phoneNumber || '',
    role: userData.role || '',
  };
}; 