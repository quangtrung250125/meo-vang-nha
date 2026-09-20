import React, { useRef } from 'react';
import { X, Printer, CheckCircle, PawPrint, Download, ShieldCheck, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const printRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatVND = (amount) => {
    if (amount === undefined || amount === null) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-primary rounded-xl">
              <PawPrint className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-text-dark text-base">Hóa đơn điện tử</h3>
              <p className="text-xs text-gray-500">Mã giao dịch: {invoice.code || invoice.id || '#HD-202609-01'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-secondary text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-200 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In hóa đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-gray-700 bg-white">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-primary text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <PawPrint className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-text-dark font-title tracking-tight">MÈO VÀNG NHÀ</h1>
                <p className="text-xs text-emerald-600 font-semibold tracking-wider uppercase">Khách sạn thú cưng cao cấp & Spa</p>
              </div>
            </div>

            <div className="text-right sm:text-right text-xs text-gray-500 space-y-0.5">
              <div className="flex items-center sm:justify-end gap-1"><MapPin className="w-3 h-3 text-primary" /> 123 Hoàng Cầu, Đống Đa, Hà Nội</div>
              <div className="flex items-center sm:justify-end gap-1"><Phone className="w-3 h-3 text-primary" /> 0988.123.456 • 024.3333.8888</div>
              <div className="flex items-center sm:justify-end gap-1"><Globe className="w-3 h-3 text-primary" /> www.meovangnha.vn</div>
            </div>
          </div>

          {/* Invoice Title & Stamp */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">PHIẾU THANH TOÁN DỊCH VỤ</span>
              <h2 className="text-xl font-extrabold text-text-dark mt-0.5">{invoice.code || '#MVN-2026-8891'}</h2>
              <p className="text-xs text-gray-500 mt-1">Ngày lập: {invoice.date || '20/09/2026 14:30'}</p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-emerald-200 text-emerald-600 font-bold text-xs shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{invoice.status || 'ĐÃ THANH TOÁN THÀNH CÔNG'}</span>
            </div>
          </div>

          {/* Customer & Pet Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-100 text-xs">
            <div>
              <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-1.5">THÔNG TIN KHÁCH HÀNG</p>
              <p className="font-bold text-text-dark text-sm">{invoice.customerName || 'Nguyễn Đức An'}</p>
              <p className="text-gray-600 mt-0.5">SĐT: {invoice.customerPhone || '0912 345 678'}</p>
              <p className="text-gray-600">Email: {invoice.customerEmail || 'ducan070@gmail.com'}</p>
              <p className="text-gray-500 mt-1">Hạng thành viên: <span className="text-amber-600 font-bold">👑 {invoice.customerTier || 'Thành viên Vàng'}</span></p>
            </div>

            <div>
              <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-1.5">THÔNG TIN BÉ MÈO & DỊCH VỤ</p>
              <p className="font-bold text-text-dark text-sm">{invoice.petNames || 'Bé Miu Miu & Bánh Bao'}</p>
              <p className="text-gray-600 mt-0.5">Phòng: <span className="font-semibold">{invoice.roomName || 'Phòng VIP Hoàng Gia'}</span></p>
              <p className="text-gray-600">Thời gian: {invoice.stayPeriod || '15/09/2026 - 19/09/2026 (4 ngày)'}</p>
              <p className="text-gray-500 mt-1">Phương thức: <span className="font-semibold text-text-dark">{invoice.paymentMethod || 'Chuyển khoản VietQR'}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Mô tả dịch vụ</th>
                  <th className="py-3 px-4 text-center">Số lượng</th>
                  <th className="py-3 px-4 text-right">Đơn giá</th>
                  <th className="py-3 px-4 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [
                  { name: 'Lưu trú phòng VIP Hoàng Gia', note: 'Phòng máy lạnh, view kính, cào móng', qty: '4 ngày', price: 250000, total: 1000000 },
                  { name: 'Combo Spa Tắm & Tỉa lông dưỡng lông', note: 'Sữa tắm thảo mộc hữu cơ cho mèo', qty: '1 bé', price: 200000, total: 200000 },
                  { name: 'Camera AI Quan sát 24/7', note: 'Truy cập không giới hạn qua app', qty: '4 ngày', price: 0, total: 0 },
                  { name: 'Thực đơn Hạt Cao Cấp & Pate Me-O', note: 'Ăn 3 bữa/ngày theo khẩu phần', qty: '4 ngày', price: 50000, total: 200000 },
                ]).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-400 font-medium">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-text-dark">{item.name}</p>
                      {item.note && <p className="text-[11px] text-gray-400">{item.note}</p>}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{item.qty}</td>
                    <td className="py-3 px-4 text-right">{formatVND(item.price)}</td>
                    <td className="py-3 px-4 text-right font-bold text-text-dark">{formatVND(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            {/* QR Code Verification */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 self-stretch sm:self-auto">
              <QRCodeSVG 
                value={`https://meovangnha.vn/invoice/${invoice.code || 'MVN-2026-8891'}`} 
                size={64}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
              />
              <div className="text-[11px] text-gray-500 space-y-0.5">
                <p className="font-bold text-text-dark flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Xác thực hóa đơn
                </p>
                <p>Quét mã QR để tra cứu</p>
                <p className="text-[10px] text-gray-400">Hệ thống Mèo Vàng Nhà</p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tổng tiền dịch vụ:</span>
                <span className="font-bold">{formatVND(invoice.subTotal || 1400000)}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Ưu đãi VIP Vàng (-10%):</span>
                <span className="font-semibold">- {formatVND(invoice.discount || 140000)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Đã đặt cọc:</span>
                <span>- {formatVND(invoice.deposit || 200000)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-primary pt-2 border-t border-gray-200">
                <span>Tổng đã thanh toán:</span>
                <span className="text-base text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                  {formatVND(invoice.total || 1060000)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note & Signatures */}
          <div className="pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs font-semibold text-text-dark">
              🐾 Cảm ơn bạn đã tin tưởng gửi gắm bé cưng cho Mèo Vàng Nhà!
            </p>
            <p className="text-[11px] text-gray-400 italic">
              Hóa đơn này có giá trị xác nhận giao dịch dịch vụ. Mọi thắc mắc xin liên hệ Hotline: 0988.123.456
            </p>
          </div>

        </div>

        {/* Modal Bottom Footer (Hidden in print) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-xs"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
