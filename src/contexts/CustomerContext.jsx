import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CustomerContext = createContext();

const STORAGE_KEY = 'meo-vang-nha-customer-profile';
const CUSTOMERS_KEY = 'meo-vang-nha-customers';
const SESSION_KEY = 'meo-vang-nha-authenticated-customer';

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

export const CustomerProvider = ({ children }) => {
    const [authenticatedCustomer, setAuthenticatedCustomer] = useState(() => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            if (saved && normalizePhone(saved.phone) === '0962606249') {
                if (!saved.fullName || saved.fullName.includes('(Chi)')) {
                    saved.fullName = 'Quản trị viên';
                    localStorage.setItem(SESSION_KEY, JSON.stringify(saved));
                }
            }
            return saved;
        } catch (error) {
            return null;
        }
    });

    const [customerProfile, setCustomerProfile] = useState(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        try {
            const parsed = JSON.parse(saved);
            if (parsed && normalizePhone(parsed.phone) === '0962606249') {
                if (!parsed.fullName || parsed.fullName.includes('(Chi)')) {
                    parsed.fullName = 'Quản trị viên';
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                }
            }
            return parsed;
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

    const authenticateCustomer = (phone, password) => {
        const normalized = normalizePhone(phone);
        // Tài khoản quản trị viên với số điện thoại 0962606249
        if (normalized === '0962606249') {
            let adminUser = findCustomerByPhone('0962606249');
            if (!adminUser || adminUser.fullName?.includes('(Chi)')) {
                adminUser = {
                    ...adminUser,
                    fullName: 'Quản trị viên',
                    phone: '0962606249',
                    email: 'admin0962606249@meovangnha.com',
                    password: password || adminUser?.password || '0962606249',
                    role: 'admin',
                    labels: ['Quản trị viên', 'Admin'],
                    pets: adminUser?.pets || [],
                    createdAt: adminUser?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                if (typeof window !== 'undefined') {
                    const existing = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || '[]');
                    const filtered = existing.filter(c => normalizePhone(c.phone) !== '0962606249');
                    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([...filtered, adminUser]));
                }
            }
            setCustomerProfile(adminUser);
            setAuthenticatedCustomer(adminUser);
            localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
            return adminUser;
        }

        const customer = findCustomerByPhone(phone);
        if (!customer || !customer.password || customer.password !== password) return null;

        setCustomerProfile(customer);
        setAuthenticatedCustomer(customer);
        localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
        return customer;
    };

    const registerCustomer = (profile) => {
        const normalizedPhone = normalizePhone(profile.phone);
        if (!normalizedPhone || !profile.password) return null;
        if (findCustomerByPhone(normalizedPhone)) return null;

        const customer = {
            ...profile,
            phone: normalizedPhone,
            customerId: `customer-${normalizedPhone}`,
            labels: profile.labels || ['Khách hàng mới'],
            pets: Array.isArray(profile.pets) ? profile.pets : [],
            createdAt: profile.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const customers = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || '[]');
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([...customers, customer]));
        setCustomerProfile(customer);
        setAuthenticatedCustomer(customer);
        localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
        return customer;
    };

    const logoutCustomer = () => {
        setAuthenticatedCustomer(null);
        setCustomerProfile(null);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STORAGE_KEY);
    };

    const isAdmin = useMemo(() => {
        return normalizePhone(authenticatedCustomer?.phone) === '0962606249';
    }, [authenticatedCustomer]);

    const value = useMemo(() => ({
        customerProfile,
        authenticatedCustomer,
        saveCustomerProfile,
        findCustomerByPhone,
        authenticateCustomer,
        registerCustomer,
        logoutCustomer,
        hasCustomerProfile: Boolean(customerProfile),
        isAuthenticated: Boolean(authenticatedCustomer),
        isAdmin,
    }), [customerProfile, authenticatedCustomer, isAdmin]);

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomerProfile = () => useContext(CustomerContext);
