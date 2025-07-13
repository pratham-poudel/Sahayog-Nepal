import { QueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from '../config/index.js';

// Base API URL - ensure this matches your backend endpoint
// Using API_BASE_URL from config which gets value from environment variables

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

export async function apiRequest(
  method,
  url,
  data,
) {
  // Setup headers with auth token if available
  const headers = {};
  const token = getAuthToken();
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Construct the full URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn = ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Setup headers with auth token if available
    const headers = {};
    const token = getAuthToken();
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Get the URL from the query key
    const queryUrl = queryKey[0];
    
    // Construct the full URL
    const fullUrl = queryUrl.startsWith('http') ? queryUrl : `${API_BASE_URL}${queryUrl}`;

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
