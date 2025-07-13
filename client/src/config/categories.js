// Hierarchical categories configuration for the platform
export const CATEGORY_STRUCTURE = {
  "Education": {
    icon: "🎓",
    subcategories: [
      "Primary Education",
      "Secondary Education", 
      "Higher Education",
      "Vocational Training",
      "Educational Infrastructure",
      "Scholarships",
      "Adult Literacy"
    ]
  },
  "Healthcare": {
    icon: "🏥",
    subcategories: [
      "Medical Treatment",
      "Medical Equipment",
      "Hospital Infrastructure",
      "Mental Health",
      "Emergency Medical",
      "Child Healthcare",
      "Senior Care"
    ]
  },
  "Animals": {
    icon: "🐾",
    subcategories: [
      "Dogs",
      "Cats", 
      "Wildlife Conservation",
      "Farm Animals",
      "Animal Shelters",
      "Veterinary Care",
      "Animal Rescue"
    ]
  },
  "Environment": {
    icon: "🌱",
    subcategories: [
      "Climate Action",
      "Reforestation",
      "Clean Energy",
      "Pollution Control",
      "Conservation",
      "Sustainable Agriculture",
      "Green Infrastructure"
    ]
  },
  "Disaster Relief": {
    icon: "🆘",
    subcategories: [
      "Earthquake Relief",
      "Flood Relief", 
      "Fire Relief",
      "Emergency Shelter",
      "Food & Water",
      "Medical Aid",
      "Reconstruction"
    ]
  },
  "Community Development": {
    icon: "🏘️",
    subcategories: [
      "Infrastructure",
      "Youth Programs",
      "Women Empowerment",
      "Senior Services",
      "Cultural Programs",
      "Community Centers",
      "Local Business Support"
    ]
  },
  "Water & Sanitation": {
    icon: "💧",
    subcategories: [
      "Clean Water Access",
      "Water Purification",
      "Sanitation Facilities",
      "Hygiene Programs",
      "Water Infrastructure",
      "Waste Management"
    ]
  }
};

// Get all main categories
export const getMainCategories = () => {
  return Object.keys(CATEGORY_STRUCTURE);
};

// Get subcategories for a main category
export const getSubcategories = (mainCategory) => {
  return CATEGORY_STRUCTURE[mainCategory]?.subcategories || [];
};

// Get all categories as flat array (for backward compatibility)
export const getAllCategoriesFlat = () => {
  return getMainCategories();
};

// Get category hierarchy for a specific main category
export const getCategoryHierarchy = (mainCategory) => {
  return CATEGORY_STRUCTURE[mainCategory] || null;
};

// Search for subcategories across all main categories
export const findSubcategoryInCategory = (subcategory) => {
  for (const [mainCategory, data] of Object.entries(CATEGORY_STRUCTURE)) {
    if (data.subcategories.includes(subcategory)) {
      return mainCategory;
    }
  }
  return null;
};

// Generate category paths for routing
export const generateCategoryPaths = () => {
  const paths = [];
  
  // Add main category paths
  for (const mainCategory of getMainCategories()) {
    paths.push({
      path: `/explore/${mainCategory.toLowerCase().replace(/\s+/g, '-')}`,
      category: mainCategory,
      subcategory: null
    });
    
    // Add subcategory paths
    const subcategories = getSubcategories(mainCategory);
    for (const subcategory of subcategories) {
      paths.push({
        path: `/explore/${mainCategory.toLowerCase().replace(/\s+/g, '-')}/${subcategory.toLowerCase().replace(/\s+/g, '-')}`,
        category: mainCategory,
        subcategory: subcategory
      });
    }
  }
  
  return paths;
};

export default CATEGORY_STRUCTURE;
