'use client'
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function AdminPanel({ onCreated }: { onCreated: (room: any) => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    if (!name.trim()) return alert('กรุณาตั้งชื่อห้องก่อนครับ');
    setLoading(true);
    
    // สุ่มรหัส 6 หลัก
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // สร้างพิกัดโต๊ะเริ่มต้น
    const defaultLayout = [
      { id: 'T1', x: 100, y: 100, label: 'T1' },
      { id: 'T2', x: 200, y: 100, label: 'T2' },
    ];

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ 
        name: name, 
        join_code: code, 
        layout_config: defaultLayout 
      }])
      .select()
      .maybeSingle(); // ใช้ maybeSingle เพื่อความปลอดภัยของ Type

    if (error) {
      // แก้จุดที่แดง: ตรวจสอบว่า error มีจริงไหมก่อนเข้าถึง .message
      alert('พบปัญหา: ' + (error.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'));
    } else if (data) {
      onCreated(data); 
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white p-10 md:p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-slate-900 text-white mx-auto rounded-lg flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-wide">Create New Room</h2>
      
      <div className="space-y-4">
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อห้อง (เช่น Yuki and bu)"
          className="w-full p-4 rounded-lg border-2 border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 shadow-inner outline-none text-center font-bold text-slate-900 transition-all text-lg"
        />
        <button 
          onClick={createRoom}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-lg uppercase transition-colors disabled:opacity-50"
        >
          {loading ? 'กำลังสร้าง...' : 'สร้างห้องและเริ่มจัดโต๊ะ'}
        </button>
      </div>
    </div>
  );
}
