// Frontend API Service - Feature Control
// File: src/services/featureControlApi.js

import axios from 'axios';
import { getHeaders } from '../utility/getHeader';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class FeatureControlAPI {
    constructor() {
        this.baseURL = `${BASE_URL}/api/feature-control`;
    }

    // Get user's current subscription
    async getUserSubscription() {
        try {
            const response = await axios.get(`${this.baseURL}/subscription`, getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription:', error);
            throw error;
        }
    }

    // Get all user features
    async getUserFeatures() {
        try {
            const response = await axios.get(`${this.baseURL}/features`, getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching features:', error);
            throw error;
        }
    }

    // Check specific feature access
    async checkFeatureAccess(featureCode) {
        try {
            const response = await axios.get(`${this.baseURL}/features/${featureCode}/access`, getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error checking feature access:', error);
            throw error;
        }
    }

    // Update feature usage
    async updateFeatureUsage(featureCode, increment = 1) {
        try {
            const response = await axios.post(
                `${this.baseURL}/features/${featureCode}/usage`,
                { increment },
                getHeaders()
            );
            return response.data;
        } catch (error) {
            console.error('Error updating feature usage:', error);
            throw error;
        }
    }

    // Get feature usage
    async getFeatureUsage(featureCode) {
        try {
            const response = await axios.get(`${this.baseURL}/features/${featureCode}/usage`, getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching feature usage:', error);
            throw error;
        }
    }

    // Get all subscription plans
    async getSubscriptionPlans() {
        try {
            const response = await axios.get(`${this.baseURL}/plans`, getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    }

    // Get plan features comparison
    async getPlanFeaturesComparison() {
        try {
            const response = await axios.get(`${this.baseURL}/plans/comparison`, getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching plan comparison:', error);
            throw error;
        }
    }

    // Change user subscription
    async changeSubscription(planCode) {
        try {
            const response = await axios.post(
                `${this.baseURL}/subscription/change`,
                { planCode },
                getHeaders()
            );
            return response.data;
        } catch (error) {
            console.error('Error changing subscription:', error);
            throw error;
        }
    }
}

const api = new FeatureControlAPI();

// Convenience function to fetch all feature data
export const fetchFeatureData = async () => {
    try {
        const [subscription, features] = await Promise.all([
            api.getUserSubscription(),
            api.getUserFeatures()
        ]);
        return {
            plan: subscription.plan,
            features: features
        };
    } catch (error) {
        console.error('Error fetching feature data:', error);
        throw error;
    }
};

export default api;
