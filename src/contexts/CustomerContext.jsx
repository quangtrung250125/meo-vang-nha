import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CustomerContext = createContext();

const STORAGE_KEY = 'meo-vang-nha-customer-profile';
const CUSTOMERS_KEY = 'meo-vang-nha-customers';

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

export const CustomerProvider = ({ children }) => {
    const [customerProfile, setCustomerProfile] = useState(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        try {
            return JSON.parse(saved);
        } catch (error) {
            return null;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (customerProfile) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(customerProfile));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [customerProfile]);

    const findCustomerByPhone = (phone) => {
        if (typeof window === 'undefined') return null;
        const storageKey = localStorage.getItem(CUSTOMERS_KEY);
        if (!storageKey) return null;

        try {
            const customers = JSON.parse(storageKey);
            const normalized = normalizePhone(phone);
            return customers.find(customer => normalizePhone(customer.phone) === normalized) || null;
        } catch (error) {
            return null;
        }
    };

    const saveCustomerProfile = (profile) => {
        const normalizedPhone = normalizePhone(profile.phone || profile.customerId || '');
        const normalized = {
            ...profile,
            labels: profile.labels || ['Khách hàng mới'],
            customerId: profile.customerId || (normalizedPhone ? `customer-${normalizedPhone}` : `customer-${Date.now()}`),
            phone: profile.phone || '',
            updatedAt: new Date().toISOString(),
            pets: Array.isArray(profile.pets) ? profile.pets : [],
        };

        if (typeof window !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || '[]');
            const nextList = normalizedPhone
                ? existing.filter(item => normalizePhone(item.phone) !== normalizedPhone)
                : [...existing];

            nextList.push(normalized);
            localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(nextList));
        }

        setCustomerProfile(normalized);
    };

    const value = useMemo(() => ({
        customerProfile,
        saveCustomerProfile,
        findCustomerByPhone,
        hasCustomerProfile: Boolean(customerProfile),
    }), [customerProfile]);

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomerProfile = () => useContext(CustomerContext);
