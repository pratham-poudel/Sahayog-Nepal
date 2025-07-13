import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL as CONFIG_API_URL } from '../config/index.js';

// Default categories as fallback
const DEFAULT_CATEGORIES = [
    "Education", 
    "Healthcare", 
    "Disaster Relief", 
    "Community Development", 
    "Heritage Preservation", 
    "Environment", 
    "Water & Sanitation"
];

const useCategories = () => {
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(`${CONFIG_API_URL}/api/campaigns/categories`);
                
                if (response.data.success && response.data.data) {
                    setCategories(response.data.data);
                } else {
                    console.warn('Invalid categories response, using default categories');
                    setCategories(DEFAULT_CATEGORIES);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError(err.message || 'Failed to fetch categories');
                // Keep default categories on error
                setCategories(DEFAULT_CATEGORIES);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return { 
        categories, 
        loading, 
        error,
        refetch: () => {
            setLoading(true);
            setError(null);
            fetchCategories();
        }
    };
};

export default useCategories;
