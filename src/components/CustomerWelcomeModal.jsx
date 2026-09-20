import React, { useMemo, useState, useEffect } from 'react';
import { X, PawPrint, Sparkles, UserRound, Cat, Phone, CheckCircle2, AlertCircle, LockKeyhole } from 'lucide-react';
import { useCustomerProfile } from '../contexts/CustomerContext';

const SOURCES = ['Google', 'Facebook/Zalo', 'TikTok', 'Giới thiệu', 'Khác'];

const initialForm = {
    fullName: '',
    phone: '',
    email: '',
    source: 'Google',
    petName: '',
    breed: '',
    age: '',
    gender: 'Đực',
    spayed: 'Chưa',
    vaccinated: 'Chưa',
    vaccineType: '',
    allergies: '',
    medicalHistory: '',
    feeding: '',
    personality: '',
    toys: '',
    specialCare: '',
};

const normalizePhone = (value = '') => value.replace(/\D/g, '');

const CustomerWelcomeModal = ({ isOpen, onClose, onSubmit }) => {
    const { findCustomerByPhone, authenticateCustomer } = useCustomerProfile();
    const [formData, setFormData] = useState(initialForm);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingCustomer, setExistingCustomer] = useState(null);
    const [passwordError, setPasswordError] = useState('');

    const crmLabels = useMemo(() => ['Khách hàng mới'], []);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setExistingCustomer(null);
            setFormData(initialForm);
            setIsSubmitting(false);
            setPasswordError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => {
        const cleanedPhone = normalizePhone(formData.phone);
        if (!cleanedPhone) return;

        const match = findCustomerByPhone(cleanedPhone);
        setExistingCustomer(match);
        setFormData(prev => ({ ...prev, phone: cleanedPhone, password: '', confirmPassword: '' }));
        setStep(2);
    };

    const handlePasswordStep = (event) => {
        event.preventDefault();
        setPasswordError('');

        if (existingCustomer) {
            if (!authenticateCustomer(formData.phone, formData.password)) {
                setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
                return;
            }
            setStep(3);
            return;
        }

        if (formData.password.length < 6) {
            setPasswordError('Mật khẩu phải có tối thiểu 6 ký tự.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Mật khẩu xác nhận không trùng khớp.');
            return;
        }
        setStep(3);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const required = [formData.fullName, formData.phone, formData.petName].every(Boolean);
        if (!required) return;

        setIsSubmitting(true);
        await onSubmit({
            ...formData,
            phone: normalizePhone(formData.phone),
            password: formData.password,
            labels: crmLabels,
            createdAt: new Date().toISOString(),
        });
        setIsSubmitting(false);
        setFormData(initialForm);
        onClose();
    };

    const renderPhoneStep = () => (
        <div className="space-y-6 p-6 md:p-8">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-800">Bước 1: Chào mừng bạn đến với Mèo Vắng Nhà</p>
                        <p className="text-sm text-emerald-700 mt-1">
                            Để bắt đầu chăm sóc tốt hơn cho mèo cưng, hãy cho chúng mình biết số điện thoại của bạn nhé. Chúng mình sẽ kiểm tra nhanh xem bạn đã từng lưu trữ hồ sơ chưa.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <label className="block text-sm font-semibold text-text-dark">
                    Số điện thoại <span className="text-red-500">*</span>
                    <div className="mt-2 relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-700 focus:border-primary focus:outline-none"
                            placeholder="09xx xxx xxx"
                        />
                    </div>
                </label>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Để sau
                </button>
                <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-2xl bg-accent px-6 py-3 font-bold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover transition-colors"
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    );

    const renderPasswordStep = () => (
        <form onSubmit={handlePasswordStep} className="space-y-6 p-6 md:p-8">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                        <LockKeyhole className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-800">
                            {existingCustomer ? 'Đăng nhập tài khoản của bạn' : 'Cài đặt mật khẩu mới'}
                        </p>
                        <p className="text-sm text-emerald-700 mt-1">
                            {existingCustomer
                                ? 'Số điện thoại đã tồn tại. Nhập mật khẩu để tiếp tục.'
                                : 'Số điện thoại chưa có dữ liệu. Tạo mật khẩu để bảo vệ hồ sơ của bạn.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-600">Số điện thoại: <span className="text-text-dark">{formData.phone}</span></p>
                <label className="block text-sm font-semibold text-text-dark">
                    {existingCustomer ? 'Mật khẩu' : 'Mật khẩu mới'} <span className="text-red-500">*</span>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(event) => handleChange('password', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                        placeholder="Tối thiểu 6 ký tự"
                    />
                </label>
                {!existingCustomer && (
                    <label className="block text-sm font-semibold text-text-dark">
                        Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(event) => handleChange('confirmPassword', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </label>
                )}
                {passwordError && <p className="text-sm font-semibold text-red-600">{passwordError}</p>}
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition-colors">Quay lại</button>
                <button type="submit" className="rounded-2xl bg-accent px-6 py-3 font-bold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover transition-colors">
                    {existingCustomer ? 'Đăng nhập' : 'Tiếp tục tạo hồ sơ'}
                </button>
            </div>
        </form>
    );

    const renderExistingCustomerStep = () => (
        <div className="space-y-6 p-6 md:p-8">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                    <div>
                        <p className="font-bold text-emerald-800">Khách hàng đã tồn tại trong CRM</p>
                        <p className="text-sm text-emerald-700 mt-1">
                            Số điện thoại này đã được lưu trữ. Hệ thống sẽ hiển thị hồ sơ cũ để bạn kiểm tra trước khi tiếp tục.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.18em] mb-4">
                        <UserRound className="w-4 h-4" />
                        Hồ sơ chủ nuôi
                    </div>
                    <div className="space-y-3 text-sm text-gray-700">
                        <p><span className="font-semibold text-text-dark">Họ tên:</span> {existingCustomer?.fullName || 'Chưa cập nhật'}</p>
                        <p><span className="font-semibold text-text-dark">Số điện thoại:</span> {existingCustomer?.phone || formData.phone}</p>
                        <p><span className="font-semibold text-text-dark">Email:</span> {existingCustomer?.email || 'Chưa cập nhật'}</p>
                        <p><span className="font-semibold text-text-dark">Kênh:</span> {existingCustomer?.source || 'Chưa cập nhật'}</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.18em] mb-4">
                        <Cat className="w-4 h-4" />
                        Hồ sơ mèo
                    </div>
                    <div className="space-y-3 text-sm text-gray-700">
                        {(existingCustomer?.pets?.length ? existingCustomer.pets : [{ name: 'Chưa có hồ sơ mèo' }]).map((pet, index) => (
                            <div key={index} className="rounded-2xl bg-white p-3 border border-gray-200">
                                <p><span className="font-semibold text-text-dark">Tên:</span> {pet.name || 'Chưa có tên'}</p>
                                <p><span className="font-semibold text-text-dark">Tuổi:</span> {pet.age || 'Chưa cập nhật'}</p>
                                <p><span className="font-semibold text-text-dark">Giống:</span> {pet.breed || 'Chưa cập nhật'}</p>
                                <p><span className="font-semibold text-text-dark">Tính cách:</span> {pet.personality?.otherDetail || pet.personality || 'Chưa cập nhật'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Thay đổi số
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl bg-accent px-6 py-3 font-bold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover transition-colors"
                >
                    Xong
                </button>
            </div>
        </div>
    );

    const renderNewCustomerStep = () => (
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50/80 p-5">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-800">Bước 2: Giới thiệu mèo cưng của bạn</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Chúng mình muốn biết thêm về bạn và bé để chăm sóc phù hợp hơn. Bạn chỉ cần điền những thông tin cơ bản nhé, rồi chúng mình sẽ lưu hồ sơ vào hệ thống.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.18em]">
                        <UserRound className="w-4 h-4" />
                        Hồ sơ chủ nuôi
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="md:col-span-2 block text-sm font-semibold text-text-dark">
                            Họ tên <span className="text-red-500">*</span>
                            <input
                                value={formData.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="Nguyễn Văn A"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Số điện thoại <span className="text-red-500">*</span>
                            <input
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="09xx xxx xxx"
                                readOnly
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Email
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="example@gmail.com"
                            />
                        </label>

                        <label className="md:col-span-2 block text-sm font-semibold text-text-dark">
                            Kênh biết đến Mèo Vắng Nhà
                            <select
                                value={formData.source}
                                onChange={(e) => handleChange('source', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                            >
                                {SOURCES.map(source => (
                                    <option key={source} value={source}>{source}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="space-y-6 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.18em]">
                        <Cat className="w-4 h-4" />
                        Hồ sơ mèo
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block text-sm font-semibold text-text-dark md:col-span-2">
                            Tên mèo <span className="text-red-500">*</span>
                            <input
                                value={formData.petName}
                                onChange={(e) => handleChange('petName', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="Mochi"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Giống
                            <input
                                value={formData.breed}
                                onChange={(e) => handleChange('breed', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="Mèo Anh lông ngắn"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Tuổi
                            <input
                                value={formData.age}
                                onChange={(e) => handleChange('age', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="2 tuổi"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Giới tính
                            <select
                                value={formData.gender}
                                onChange={(e) => handleChange('gender', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                            >
                                <option value="Đực">Đực</option>
                                <option value="Cái">Cái</option>
                            </select>
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Triệt sản
                            <select
                                value={formData.spayed}
                                onChange={(e) => handleChange('spayed', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                            >
                                <option value="Rồi">Rồi</option>
                                <option value="Chưa">Chưa</option>
                            </select>
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Vaccine
                            <select
                                value={formData.vaccinated}
                                onChange={(e) => handleChange('vaccinated', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                            >
                                <option value="Rồi">Rồi</option>
                                <option value="Chưa">Chưa</option>
                            </select>
                        </label>

                        {formData.vaccinated === 'Rồi' && (
                            <label className="block text-sm font-semibold text-text-dark">
                                Tên loại vaccin
                                <input
                                    value={formData.vaccineType}
                                    onChange={(e) => handleChange('vaccineType', e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                    placeholder="V4, Felocell, Nobivac..."
                                />
                            </label>
                        )}

                        <label className="md:col-span-2 block text-sm font-semibold text-text-dark">
                            Dị ứng, tiền sử bệnh & vấn đề cần lưu ý
                            <textarea
                                rows={3}
                                value={formData.allergies}
                                onChange={(e) => handleChange('allergies', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none resize-none"
                                placeholder="Dị ứng với cá, bị chảy nước mắt, hay run khi ở nơi mới..."
                            />
                        </label>

                        <label className="md:col-span-2 block text-sm font-semibold text-text-dark">
                            Thói quen ăn uống
                            <textarea
                                rows={2}
                                value={formData.feeding}
                                onChange={(e) => handleChange('feeding', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none resize-none"
                                placeholder="Ăn 2 bữa/ngày, thích pate cá ngừ, uống nước sạch..."
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Tính cách
                            <input
                                value={formData.personality}
                                onChange={(e) => handleChange('personality', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="Nhút nhát, hiếu động, dễ gần..."
                            />
                        </label>

                        <label className="block text-sm font-semibold text-text-dark">
                            Sở thích đồ chơi
                            <input
                                value={formData.toys}
                                onChange={(e) => handleChange('toys', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none"
                                placeholder="Bóng len, que cào, gậy dây"
                            />
                        </label>

                        <label className="md:col-span-2 block text-sm font-semibold text-text-dark">
                            Yêu cầu chăm sóc đặc biệt khác
                            <textarea
                                rows={3}
                                value={formData.specialCare}
                                onChange={(e) => handleChange('specialCare', e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-primary focus:outline-none resize-none"
                                placeholder="Thích không gian riêng, cần giữ nhiệt độ ổn định, không để cạnh mèo khác..."
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Quay lại
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-accent px-6 py-3 font-bold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover transition-colors disabled:opacity-80"
                >
                    {isSubmitting ? 'Đang ghi nhận...' : 'Xong'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl border border-orange-100">
                <div className="flex items-center justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 px-6 py-5 md:px-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-white rounded-2xl p-2.5 shadow-md">
                            <PawPrint className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">Welcome onboarding</p>
                            <h2 className="text-2xl font-extrabold text-text-dark font-title">
                                {step === 1 ? 'Xác nhận thông tin khách hàng' : (existingCustomer ? 'Hồ sơ khách hàng cũ' : 'Tạo hồ sơ mới')}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 hover:bg-white hover:text-gray-800 transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 1 && renderPhoneStep()}
                {step === 2 && renderPasswordStep()}
                {step === 3 && existingCustomer && renderExistingCustomerStep()}
                {step === 3 && !existingCustomer && renderNewCustomerStep()}
            </div>
        </div>
    );
};

export default CustomerWelcomeModal;
