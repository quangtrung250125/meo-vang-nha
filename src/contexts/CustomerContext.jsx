import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { fetchServerSync, pushServerSync, broadcastEvent, subscribeSyncEvents, setSyncIdentity } from '../services/crossDeviceSync';
import { getAdminEmails, isAdminUser } from '../utils/adminAccess';
import { normalizeVnPhone } from '../utils/phone';
import { fromPetRow, toPetRow, newUuid } from '../utils/petRows';

const CustomerContext = createContext();

const STORAGE_KEY = 'meo-vang-nha-customer-profile';
const CUSTOMERS_KEY = 'meo-vang-nha-customers';
const SESSION_KEY = 'meo-vang-nha-authenticated-customer';
const PHONE_MAP_KEY = 'meo-vang-nha-phone-email-map';

const normalizePhone = (phone = '') => normalizeVnPhone(phone);

const ADMIN_EMAILS = getAdminEmails({
    emails: import.meta.env?.VITE_ADMIN_EMAILS,
    phones: import.meta.env?.VITE_ADMIN_PHONES,
});

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

// Gọi API đăng nhập/kiểm tra SĐT. Trả về null nếu API không chạy (ví dụ host tĩnh).
const callPhoneAuthApi = async (action, body) => {
    try {
        const res = await fetch(`/api/auth/phone?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => null);
        if (!json) return null;
        return { ...json, status: res.status };
    } catch {
        return null;
    }
};

const rememberPhoneOnServer = async (user) => {
    const phone = user?.user_metadata?.phone;
    if (!user?.id || !phone) return;
    try {
        await supabase.from('customer_profiles').upsert({ id: user.id, phone, email: user.email || '' });
    } catch (err) {
        console.warn('Không thể cập nhật SĐT lên customer_profiles:', err);
    }
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

// Đăng nhập bằng SĐT: server tìm đúng tài khoản gắn với SĐT nên dùng được trên mọi thiết bị.
// Nếu API không chạy thì thử email đã nhớ trên máy này và email ẩn <sđt>@meovangnha.vn.
const signInWithPhone = async (phone, password) => {
    const result = await callPhoneAuthApi('login', { phone, password });
    if (result?.success && result.session) {
        const { data, error } = await supabase.auth.setSession(result.session);
        if (error) throw new Error(getFriendlyErrorMessage(error));
        return data.user;
    }
    if (result && result.status >= 400 && result.status < 500 && result.status !== 404) {
        throw new Error(result.message || 'Số điện thoại hoặc mật khẩu không chính xác!');
    }

    const candidates = [...new Set([getPhoneEmailMap()[phone], `${phone}@meovangnha.vn`].filter(Boolean))];
    let lastError = null;
    for (const email of candidates) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return data.user;
        lastError = error;
    }
    throw new Error(getFriendlyErrorMessage(lastError));
};

export const CustomerProvider = ({ children }) => {
    const [authenticatedCustomer, setAuthenticatedCustomer] = useState(() => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            // Phiên admin đăng nhập cứng kiểu cũ (không qua Supabase) không còn hợp lệ
            if (saved?.id === 'admin-0962606249') {
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            setSyncIdentity({ userId: saved?.id || null, isAdmin: false });
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
    // Quyền admin chỉ được bật sau khi Supabase xác thực phiên đăng nhập, không đọc từ localStorage
    const [verifiedAdmin, setVerifiedAdmin] = useState(false);

    // Chuyển đổi Supabase User sang Customer object chuẩn của app
    const mapSupabaseUserToCustomer = useCallback(async (user) => {
        if (!user) return null;
        setVerifiedAdmin(isAdminUser(user, ADMIN_EMAILS));
        const meta = user.user_metadata || {};
        let fullName = meta.full_name || meta.fullName || user.email?.split('@')[0] || 'Khách hàng';
        const phone = meta.phone || '';

        if (normalizePhone(phone) === '0962606249') {
            fullName = 'Quản trị viên';
        }

        // Tải danh sách thú cưng từ bảng pets của Supabase
        let pets = [];
        try {
            const { data: petsData, error: petsError } = await supabase
                .from('pets')
                .select('*')
                .eq('customer_id', user.id);

            if (petsError) console.warn('Lỗi đọc bảng pets từ Supabase:', petsError.message);
            if (petsData && petsData.length > 0) {
                pets = petsData.map((row) => {
                    const pet = fromPetRow(row);
                    return { ...pet, avatar: pet.avatar || pet.imagePreview };
                });
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

        // Đồng bộ hồ sơ từ server API khi load app
        (async () => {
            try {
                const serverData = await fetchServerSync();
                if (serverData && Array.isArray(serverData.profiles) && serverData.profiles.length > 0 && isMounted) {
                    // Chỉ nhận hồ sơ của chính tài khoản đang đăng nhập
                    const sessionId = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.id;
                    const latest = sessionId ? serverData.profiles.find((p) => p.id === sessionId) : null;
                    if (latest) {
                        setCustomerProfile(prev => {
                            if (!prev || !prev.fullName) {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(latest));
                                return latest;
                            }
                            return prev;
                        });
                    }
                }
            } catch (e) {}
        })();

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
                setVerifiedAdmin(false);
                setAuthenticatedCustomer(null);
                setCustomerProfile(null);
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(STORAGE_KEY);
            }
            setAuthLoading(false);
        });

        // Lắng nghe sync event từ thiết bị khác
        const unsubSync = subscribeSyncEvents(({ type, payload }) => {
            if (type === 'PROFILE_UPDATED' && payload?.profile && isMounted) {
                const prof = payload.profile;
                const sessionId = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.id;
                if (!sessionId || prof.id !== sessionId) return;
                setCustomerProfile(prof);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(prof));
            }
        });

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
            unsubSync();
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

        // Mỗi số điện thoại chỉ được gắn với một tài khoản để đăng nhập bằng SĐT không bị nhầm
        if (normalizedPhone) {
            const check = await callPhoneAuthApi('check', { phone: rawPhone });
            if (check?.taken) {
                throw new Error('Số điện thoại này đã được đăng ký, vui lòng đăng nhập!');
            }
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
                    const { error: petInsertError } = await supabase.from('pets').insert({
                        id: newUuid(),
                        ...toPetRow({
                            ...pet,
                            breed: pet.breed || pet.type || 'Mèo',
                            notes: pet.notes || pet.specialRequests || pet.habits || '',
                        }, user.id),
                    });
                    if (petInsertError) console.warn('Lỗi lưu thú cưng vào Supabase:', petInsertError.message);
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

    // Đăng nhập bằng Email hoặc Số điện thoại qua Supabase
    const authenticateCustomer = async (identifier, password) => {
        if (!identifier || !password) {
            throw new Error('Vui lòng nhập tài khoản và mật khẩu!');
        }

        const trimmed = identifier.trim();
        const normalized = normalizePhone(trimmed);

        let user = null;

        if (trimmed.includes('@')) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: trimmed.toLowerCase(),
                password,
            });
            if (error) {
                throw new Error(getFriendlyErrorMessage(error));
            }
            user = data.user;
        } else {
            user = await signInWithPhone(normalized, password);
        }

        // Ghi lại SĐT + email lên customer_profiles để lần sau đăng nhập bằng SĐT ở thiết bị nào cũng tìm được
        rememberPhoneOnServer(user);

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

        // Đồng bộ lên Server API và phát broadcast tức thì qua Supabase Cloud
        pushServerSync({ profiles: [normalized] });
        broadcastEvent('PROFILE_UPDATED', { profile: normalized });

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
            setVerifiedAdmin(false);
            setAuthenticatedCustomer(null);
            setCustomerProfile(null);
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const isAdmin = verifiedAdmin && Boolean(authenticatedCustomer);

    useEffect(() => {
        setSyncIdentity({ userId: authenticatedCustomer?.id || null, isAdmin });
    }, [authenticatedCustomer, isAdmin]);

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
