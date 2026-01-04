// Frontend API Service - Feature Control
// File: services/SubscriptionAPI.js

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class SubscriptionAPI {
    constructor(getHeaders = null) {
        this.baseURL = `${BASE_URL}/api/feature-control`;
        this.getHeaders = getHeaders || (() => ({}));
    }

    // Set headers function (for projects that need custom headers)
    setHeadersFunction(getHeaders) {
        this.getHeaders = getHeaders;
    }

    // Get user's current subscription
    async getUserSubscription() {
        try {
            const response = await axios.get(`${this.baseURL}/subscription`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription:', error);
            throw error;
        }
    }

    // Get all user features
    async getUserFeatures() {
        try {
            const response = await axios.get(`${this.baseURL}/features`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching features:', error);
            throw error;
        }
    }

    // Check specific feature access
    async checkFeatureAccess(featureCode) {
        try {
            const response = await axios.get(`${this.baseURL}/features/${featureCode}/access`, this.getHeaders());
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
                this.getHeaders()
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
            const response = await axios.get(`${this.baseURL}/features/${featureCode}/usage`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching feature usage:', error);
            throw error;
        }
    }

    // Get all subscription plans
    async getSubscriptionPlans() {
        try {
            const response = await axios.get(`${this.baseURL}/plans`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    }

    // Get plan features comparison
    async getPlanFeaturesComparison() {
        try {
            const response = await axios.get(`${this.baseURL}/plans/comparison`, this.getHeaders());
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
                this.getHeaders()
            );
            return response.data;
        } catch (error) {
            console.error('Error changing subscription:', error);
            throw error;
        }
    }

    // Convenience method to fetch all feature data
    async fetchFeatureData() {
        try {
            const [subscription, features] = await Promise.all([
                this.getUserSubscription(),
                this.getUserFeatures()
            ]);
            return {
                plan: subscription.plan,
                features: features
            };
        } catch (error) {
            console.error('Error fetching feature data:', error);
            throw error;
        }
    }
}

export default SubscriptionAPI;
