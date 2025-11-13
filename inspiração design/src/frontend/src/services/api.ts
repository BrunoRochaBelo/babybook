/**
 * Base API client configuration
 * This will be used with Supabase or your custom backend
 */

import { API_ENDPOINTS } from '../lib/constants';

// Type definitions for API requests
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string;
  mode: string;
  userId: string;
  createdAt: string;
}

export interface Moment {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  date: string;
  story?: string;
  mediaUrls: string[];
  isRecurrent: boolean;
  babyId: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  babyId: string;
  type: 'vaccine' | 'measurement';
  date: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface GuestbookMessage {
  id: string;
  babyId: string;
  authorName: string;
  message: string;
  mediaUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/**
 * API Client class
 * Replace with actual implementation when backend is ready
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  // Mock implementation - replace with real API calls
  async login(credentials: LoginCredentials): Promise<{ token: string; user: any }> {
    console.log('API: Login', credentials);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: 'mock-token-123',
          user: { id: '1', email: credentials.email }
        });
      }, 500);
    });
  }

  async register(data: RegisterData): Promise<{ token: string; user: any }> {
    console.log('API: Register', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          token: 'mock-token-123',
          user: { id: '1', email: data.email, name: data.name }
        });
      }, 500);
    });
  }

  async createBabyProfile(data: Omit<BabyProfile, 'id' | 'userId' | 'createdAt'>): Promise<BabyProfile> {
    console.log('API: Create baby profile', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...data,
          id: 'baby-' + Date.now(),
          userId: '1',
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  }

  async getMoments(babyId: string, chapterId?: string): Promise<Moment[]> {
    console.log('API: Get moments', { babyId, chapterId });
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 300);
    });
  }

  async createMoment(data: Omit<Moment, 'id' | 'createdAt'>): Promise<Moment> {
    console.log('API: Create moment', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...data,
          id: 'moment-' + Date.now(),
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  }

  async uploadMedia(file: File, type: 'video' | 'audio' | 'photo'): Promise<{ url: string }> {
    console.log('API: Upload media', { fileName: file.name, type });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          url: `https://example.com/uploads/${type}/${file.name}`
        });
      }, 1000);
    });
  }

  async getHealthRecords(babyId: string): Promise<HealthRecord[]> {
    console.log('API: Get health records', { babyId });
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 300);
    });
  }

  async createHealthRecord(data: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
    console.log('API: Create health record', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...data,
          id: 'health-' + Date.now(),
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  }

  async getGuestbookMessages(babyId: string, status?: 'pending' | 'approved'): Promise<GuestbookMessage[]> {
    console.log('API: Get guestbook messages', { babyId, status });
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 300);
    });
  }

  async createGuestbookMessage(data: Omit<GuestbookMessage, 'id' | 'status' | 'createdAt'>): Promise<GuestbookMessage> {
    console.log('API: Create guestbook message', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...data,
          id: 'guest-' + Date.now(),
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  }

  async moderateGuestbookMessage(id: string, status: 'approved' | 'rejected'): Promise<void> {
    console.log('API: Moderate message', { id, status });
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export the class for testing purposes
export default ApiClient;
