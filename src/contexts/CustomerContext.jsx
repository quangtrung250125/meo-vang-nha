import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CustomerContext = createContext();

const STORAGE_KEY = 'meo-vang-nha-customer-profile';
const CUSTOMERS_KEY = 'meo-vang-nha-customers';
const SESSION_KEY = 'meo-vang-nha-authenticated-customer';
const PHONE_MAP_KEY = 'meo-vang-nha-phone-email-map';

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

const getFriendlyErrorMessage = (error) => {
    if (!error) return 'Đã xảy ra lỗi không xác định!';
    const msg = error.message || '';
    if (msg.includes('Invalid login credentials')) {
        return 'Email, số điện thoại hoặc mật khẩu không chính xác!';
    }
    if (msg.includes('User already registered') || error.status === 422) {
        return 'Email hoặc tài khoản này đã được đăng ký! Vui lòng chọn Đăng nhập.';
    }
    if (msg.includes('Password should be at least')) {
        return 'Mật khẩu phải có tối thiểu 6 ký tự!';
    }
    if (msg.includes('invalid format')) {
        return 'Định dạng email không hợp lệ!';
    }
    if (msg.includes('Email not confirmed')) {
        return 'Tài khoản chưa được xác thực email!';
    }
    return msg || 'Thao tác không thành công, vui lòng thử lại!';
};

// Helper ánh xạ phone -> email lưu trữ local để hỗ trợ đăng nhập bằng SĐT
const getPhoneEmailMap = () => {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(PHONE_MAP_KEY) || '{}');
    } catch {
        return {};
    }
};

const savePhoneEmailMap = (phone, email) => {
    if (typeof window === 'undefined' || !phone || !email) return;
    try {
        const map = getPhoneEmailMap();
        map[normalizePhone(phone)] = email.trim().toLowerCase();
        localStorage.setItem(PHONE_MAP_KEY, JSON.stringify(map));
    } catch (e) {
        console.warn('Lỗi lưu phone map:', e);
    }
};

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
        } catch {
            return null;
        }
    });

    const [customerProfile, setCustomerProfile] = useState(() => {
        if (typeof window === 'undefined') return null;
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (parsed && normalizePhone(parsed.phone) === '0962606249') {
                if (!parsed.fullName || parsed.fullName.includes('(Chi)')) {
                    parsed.fullName = 'Quản trị viên';
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                }
            }
            return parsed;
        } catch {
            return null;
        }
    });

    const [authLoading, setAuthLoading] = useState(true);

    // Chuyển đổi Supabase User sang Customer object chuẩn của app
    const mapSupabaseUserToCustomer = useCallback(async (user) => {
        if (!user) return null;
        const meta = user.user_metadata || {};
        let fullName = meta.full_name || meta.fullName || user.email?.split('@')[0] || 'Khách hàng';
        const phone = meta.phone || '';

        if (normalizePhone(phone) === '0962606249') {
            fullName = 'Quản trị viên';
        }

        // Tải danh sách thú cưng từ bảng pets của Supabase
        let pets = [];
        try {
            const { data: petsData } = await supabase
                .from('pets')
                .select('*')
                .eq('user_id', user.id);

            if (petsData && petsData.length > 0) {
                pets = petsData.map(p => ({
                    id: p.id,
                    name: p.name,
                    age: p.age,
                    weight: p.weight,
                    breed: p.type || 'Mèo',
                    notes: p.notes || '',
                    gender: p.gender,
                    avatar: p.avatar,
                    createdAt: p.created_at
                }));
            }
        } catch (err) {
            console.warn('Không thể tải pets từ Supabase:', err);
        }

        const customer = {
            id: user.id,
            customerId: user.id,
            fullName,
            phone,
            email: user.email || '',
            labels: meta.labels || ['Khách hàng thân thiết'],
            pets,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };

        if (phone && user.email) {
            savePhoneEmailMap(phone, user.email);
        }

        return customer;
    }, []);

    // Khởi tạo phiên từ Supabase khi App load
    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn('Lỗi lấy phiên Supabase:', error);
                }

                if (session?.user && isMounted) {
                    const customer = await mapSupabaseUserToCustomer(session.user);
                    setAuthenticatedCustomer(customer);
                    setCustomerProfile(customer);
                    localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
                }
            } catch (err) {
                console.error('Khởi tạo Auth thất bại:', err);
            } finally {
                if (isMounted) setAuthLoading(false);
            }
        };

        initializeAuth();

        // Lắng nghe sự kiện thay đổi trạng thái Auth của Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            if (session?.user) {
                const customer = await mapSupabaseUserToCustomer(session.user);
                setAuthenticatedCustomer(customer);
                setCustomerProfile(customer);
                localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
            } else if (event === 'SIGNED_OUT') {
                setAuthenticatedCustomer(null);
                setCustomerProfile(null);
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(STORAGE_KEY);
            }
            setAuthLoading(false);
        });

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, [mapSupabaseUserToCustomer]);

    // Tìm kiếm khách hàng theo SĐT từ bộ nhớ cache hoặc phone map
    const findCustomerByPhone = (phone) => {
        if (typeof window === 'undefined') return null;
        const normalized = normalizePhone(phone);
        if (!normalized) return null;

        try {
            const map = getPhoneEmailMap();
            if (map[normalized]) {
                return { phone: normalized, email: map[normalized] };
            }

            const rawCustomers = localStorage.getItem(CUSTOMERS_KEY);
            if (rawCustomers) {
                const customers = JSON.parse(rawCustomers);
                return customers.find(c => normalizePhone(c.phone) === normalized) || null;
            }
        } catch {
            return null;
        }
        return null;
    };

    // Đăng ký tài khoản mới lên Supabase
    const registerCustomer = async (profile) => {
        const rawPhone = profile.phone || '';
        const normalizedPhone = normalizePhone(rawPhone);
        const fullName = (profile.fullName || '').trim();
        const password = profile.password;

        // Nếu email không được nhập (ví dụ qua popup Welcome nhanh), tạo email định dạng phone
        const email = (profile.email && profile.email.includes('@'))
            ? profile.email.trim().toLowerCase()
            : (normalizedPhone ? `${normalizedPhone}@meovangnha.vn` : '');

        if (!email || !password) {
            throw new Error('Email/Số điện thoại và Mật khẩu là bắt buộc!');
        }

        // 1. Gọi Supabase Auth để tạo tài khoản
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: rawPhone,
                    labels: profile.labels || ['Khách hàng mới'],
                }
            }
        });

        if (error) {
            throw new Error(getFriendlyErrorMessage(error));
        }

        const user = data.user;
        if (!user) {
            throw new Error('Đăng ký không thành công, vui lòng thử lại.');
        }

        // 2. Lưu trực tiếp vào bảng public.customer_profiles trong Supabase Database
        try {
            const { error: profileError } = await supabase.from('customer_profiles').upsert({
                id: user.id,
                phone: rawPhone,
                full_name: fullName,
                email: email,
                labels: profile.labels || ['Khách hàng mới'],
            });
            if (profileError) {
                console.warn('Cảnh báo ghi bảng customer_profiles:', profileError.message);
            }
        } catch (tableErr) {
            console.warn('Lỗi lưu vào customer_profiles:', tableErr);
        }

        // 3. Lưu liên kết phone -> email
        if (normalizedPhone) {
            savePhoneEmailMap(normalizedPhone, email);
        }

        // 3. Nếu có thông tin thú cưng kèm theo, lưu vào bảng pets của Supabase
        const petsToSave = Array.isArray(profile.pets) ? profile.pets : [];
        if (petsToSave.length > 0 && user.id) {
            for (const pet of petsToSave) {
                try {
                    await supabase.from('pets').insert({
                        user_id: user.id,
                        name: pet.name || 'Bé cưng',
                        type: pet.breed || pet.type || 'Mèo',
                        age: pet.age ? String(pet.age) : null,
                        weight: pet.weight ? String(pet.weight) : null,
                        gender: pet.gender || null,
                        notes: pet.notes || pet.specialRequests || pet.habits || null,
                    });
                } catch (petErr) {
                    console.warn('Lỗi lưu thú cưng vào Supabase:', petErr);
                }
            }
        }

        const customer = await mapSupabaseUserToCustomer(user);
        setAuthenticatedCustomer(customer);
        setCustomerProfile(customer);
        localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));

        return customer;
    };

    // Đăng nhập bằng Email hoặc Số điện thoại qua Supabase (kèm hỗ trợ Admin bypass nếu cần)
    const authenticateCustomer = async (identifier, password) => {
        if (!identifier || !password) {
            throw new Error('Vui lòng nhập tài khoản và mật khẩu!');
        }

        const trimmed = identifier.trim();
        const normalized = normalizePhone(trimmed);

        // Hỗ trợ đăng nhập nhanh tài khoản Admin 0962606249
        if (normalized === '0962606249' && password === 'admin') {
            const adminCustomer = {
                id: 'admin-0962606249',
                customerId: 'admin-0962606249',
                fullName: 'Quản trị viên',
                phone: '0962606249',
                email: 'admin@meovangnha.vn',
                role: 'admin',
                labels: ['Quản trị viên'],
                pets: [],
                createdAt: new Date().toISOString(),
            };
            setAuthenticatedCustomer(adminCustomer);
            setCustomerProfile(adminCustomer);
            localStorage.setItem(SESSION_KEY, JSON.stringify(adminCustomer));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(adminCustomer));
            return adminCustomer;
        }

        let targetEmail = '';

        if (trimmed.includes('@')) {
            targetEmail = trimmed.toLowerCase();
        } else {
            // Identifier là số điện thoại
            const map = getPhoneEmailMap();
            if (map[normalized]) {
                targetEmail = map[normalized];
            } else {
                targetEmail = `${normalized}@meovangnha.vn`;
            }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password,
        });

        if (error) {
            throw new Error(getFriendlyErrorMessage(error));
        }

        const user = data.user;
        const customer = await mapSupabaseUserToCustomer(user);
        setAuthenticatedCustomer(customer);
        setCustomerProfile(customer);
        localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));

        return customer;
    };

    // Cập nhật thông tin hồ sơ
    const saveCustomerProfile = async (profile) => {
        const normalized = {
            ...(customerProfile || {}),
            ...profile,
            updatedAt: new Date().toISOString(),
        };
        setCustomerProfile(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

        if (normalized.id) {
            try {
                await supabase.from('customer_profiles').upsert({
                    id: normalized.id,
                    phone: normalized.phone || '',
                    full_name: normalized.fullName || normalized.full_name || '',
                    email: normalized.email || '',
                    labels: normalized.labels || ['Khách hàng mới'],
                });
            } catch (err) {
                console.warn('Lỗi cập nhật customer_profiles:', err);
            }
        }
    };

    // Đăng xuất khỏi Supabase
    const logoutCustomer = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Supabase signOut error:', err);
        } finally {
            setAuthenticatedCustomer(null);
            setCustomerProfile(null);
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const isAdmin = useMemo(() => {
        return normalizePhone(authenticatedCustomer?.phone) === '0962606249';
    }, [authenticatedCustomer]);

    const value = useMemo(() => ({
        customerProfile,
        authenticatedCustomer,
        authLoading,
        isAdmin,
        saveCustomerProfile,
        findCustomerByPhone,
        authenticateCustomer,
        registerCustomer,
        logoutCustomer,
        hasCustomerProfile: Boolean(customerProfile),
        isAuthenticated: Boolean(authenticatedCustomer),
    }), [customerProfile, authenticatedCustomer, authLoading, isAdmin]);

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomerProfile = () => useContext(CustomerContext);
