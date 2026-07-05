'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const ClassroomCanvas = dynamic(() => import('@/components/ClassroomCanvas'), { ssr: false });

export default function RoomEditor({ room, onDataChange, onGoHome }: { room: any, onDataChange: () => Promise<void>, onGoHome?: () => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>('editor');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // แปลงเวลา ISO เป็น Format สำหรับ input time (HH:mm)
  const getLocalTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };
  const [startTime, setStartTime] = useState<string>(getLocalTime(room.start_time));
  const [endTime, setEndTime] = useState<string>(getLocalTime(room.end_time));

  // 1. ฟังก์ชันดึงข้อมูลผู้จอง
  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false });
    if (data) setBookings(data);
  };

  useEffect(() => {
    fetchBookings();

    // เปิดใช้งาน Supabase Realtime สำหรับหน้า Dashboard แอดมิน
    const channel = supabase
      .channel(`admin_bookings_${room.id}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `room_id=eq.${room.id}` }, (payload) => {
        setBookings(prev => [payload.new, ...prev]); // นำคนจองใหม่แทรกขึ้นด้านบนสุด
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bookings', filter: `room_id=eq.${room.id}` }, (payload) => {
        setBookings(prev => prev.filter(b => b.id !== payload.old.id)); // ลบข้อมูลที่โดนยกเลิกออกทันที
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  // แก้ไขตรงนี้: ปรับ parameter ให้เป็น any หรือ any[] เพื่อรับค่าจาก Canvas
  const handleSave = async (updatedData: any) => {
    try {
      // ในโหมด Editor ค่าที่ส่งกลับมาควรเป็น Array ของโต๊ะ (Layout)
      const { error } = await supabase
        .from('rooms')
        .update({ layout_config: updatedData })
        .eq('id', room.id);

      if (error) throw error;
      await onDataChange(); // แจ้งให้ Parent component ดึงข้อมูลใหม่
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // ฟังก์ชันบันทึกเวลาเปิดจอง
  const handleSaveTime = async () => {
    try {
      let startTimestamp = null;
      if (startTime) {
        const now = new Date();
        const [hours, minutes] = startTime.split(':');
        now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0); // ตั้งเป็นเวลาของวันนี้
        startTimestamp = now.toISOString();
      }

      let endTimestamp = null;
      if (endTime) {
        const now = new Date();
        const [hours, minutes] = endTime.split(':');
        now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0); // ตั้งเป็นเวลาของวันนี้
        endTimestamp = now.toISOString();
      }

      const { error } = await supabase
        .from('rooms')
        .update({ start_time: startTimestamp, end_time: endTimestamp })
        .eq('id', room.id);
      if (error) throw error;
      alert('บันทึกเวลาสำเร็จ!');
      await onDataChange();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // ฟังก์ชันยกเลิกเวลาเปิดจอง
  const handleClearTime = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ start_time: null, end_time: null })
        .eq('id', room.id);
      if (error) throw error;
      setStartTime('');
      setEndTime('');
      alert('ยกเลิกการตั้งเวลาเรียบร้อยแล้ว!');
      await onDataChange();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // 2. ฟังก์ชันยกเลิกการจองโดย Admin
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('ยืนยันที่จะยกเลิกการจองของโต๊ะนี้ใช่หรือไม่?')) return;
    
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    } else {
      fetchBookings(); // อัปเดตตารางใหม่
    }
  };

  // ฟังก์ชันส่งออกเป็น CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    const header = ['เวลาที่จอง', 'หมายเลขโต๊ะ', 'ชื่อ-นามสกุล'];
    const rows = bookings.map(b => [
      new Date(b.created_at).toLocaleString('th-TH'),
      b.desk_id,
      b.user_name
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [header, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_${room.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col md:space-y-6 h-full relative">
      {/* โหมดมือถือ: ปุ่มลอยสำหรับเปิดเมนู Settings */}
      <div className="md:hidden absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={() => setShowMobileMenu(true)} className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-900 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* เมนูสลับหน้า Dashboard / Editor */}
      <div className="hidden md:flex p-1.5 bg-slate-200/60 backdrop-blur-md rounded-full w-fit mx-auto md:mx-0 border border-slate-200/50 shadow-inner">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`px-6 md:px-8 py-2.5 rounded-full font-bold transition-all duration-300 text-sm md:text-base ${activeTab === 'dashboard' ? 'bg-white text-indigo-700 shadow-md shadow-slate-300/50 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Dashboard
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('editor')} 
          className={`px-6 md:px-8 py-2.5 rounded-full font-bold transition-all duration-300 text-sm md:text-base ${activeTab === 'editor' ? 'bg-white text-indigo-700 shadow-md shadow-slate-300/50 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Editor
          </span>
        </button>
      </div>

      {activeTab === 'editor' ? (
        /* ส่วนที่ 1: Editor จัดวางโต๊ะ */
        <div className="bg-slate-50 md:bg-white md:p-8 rounded-none md:rounded-[2.5rem] shadow-none md:shadow-xl border-0 md:border border-indigo-100 animate-in fade-in duration-300 flex flex-col flex-1 absolute inset-0 md:relative w-full h-full z-10">
          <div className="hidden md:flex justify-between items-center mb-4 md:mb-6 px-4 md:px-0 pt-4 md:pt-0">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest flex items-center gap-3">
              โหมดจัดวางโต๊ะเรียน
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/room/${room.join_code || room.id}`);
                  alert('คัดลอกลิ้งก์เรียบร้อยแล้ว');
                }}
                className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                แชร์ลิ้งก์จอง
              </button>
            </h3>
            <div className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">
              EDITOR MODE
            </div>
          </div>
  
          {/* กล่องตั้งเวลาเปิดจอง */}
          <div className="hidden md:flex bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 flex-col md:flex-row items-center gap-4 justify-between shadow-sm">
            <div className="flex-1 text-center md:text-left">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 justify-center md:justify-start">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ตั้งเวลาเปิด-ปิดจอง
            </h4>
              <p className="text-xs text-slate-500 mt-1">ตั้งเวลาเพื่อบังคับให้ระบบล็อกแผนผังและสิ้นสุดการจองตามเวลา</p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-300">
                <span className="text-xs font-bold text-slate-500 uppercase">เปิด</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="p-1 text-sm outline-none font-bold text-slate-700 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-300">
                <span className="text-xs font-bold text-slate-500 uppercase">ปิด</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="p-1 text-sm outline-none font-bold text-slate-700 bg-transparent"
                />
              </div>
              <button onClick={handleSaveTime} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors uppercase tracking-wide shadow-sm">Save</button>
              {(startTime || endTime) && (
                <button onClick={handleClearTime} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors uppercase tracking-wide border border-red-100">Clear</button>
              )}
            </div>
          </div>

          <ClassroomCanvas 
            initialLayout={room.layout_config} 
            bookings={bookings} // ส่ง bookings ไปให้ Admin เห็นชื่อคนจองบนแผนผังด้วย
            onSave={handleSave} 
            isReadOnly={false}  
          />
          
          <div className="hidden md:block mt-2 md:mt-6 text-center text-slate-400 text-xs md:text-sm pb-4 md:pb-0">
            * ระบบจะบันทึกแผนผังอัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลง *
          </div>
        </div>
      ) : (
        /* ส่วนที่ 2: Dashboard แสดงรายชื่อผู้จอง */
        <div className="space-y-4 md:space-y-6 bg-slate-50 md:bg-transparent absolute inset-0 md:relative z-10 p-4 md:p-0 overflow-y-auto">
          <div className="bg-white md:p-6 rounded-2xl border border-slate-200 animate-in fade-in duration-300 flex flex-col shrink-0 overflow-hidden">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-4 px-4 md:px-0 pt-4 md:pt-0">ภาพรวมแผนผัง</h3>
            <ClassroomCanvas 
              initialLayout={room.layout_config} 
              bookings={bookings}
              onSave={() => {}} // Read-only, no action on save
              isReadOnly={true}  
            />
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 animate-in fade-in duration-300 mb-20 md:mb-0">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-1">รายชื่อผู้จอง</h3>
                <p className="text-sm text-slate-500">ที่นั่งถูกจองแล้ว {bookings.length} / {room.layout_config?.length || 0} โต๊ะ</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm uppercase">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export CSV
                  </span>
                </button>
                <button onClick={fetchBookings} className="text-sm bg-white text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm uppercase">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> รีเฟรชข้อมูล
                  </span>
                </button>
              </div>
            </div>
    
            {bookings.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-400 font-bold">ยังไม่มีผู้จองที่นั่งในขณะนี้</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-widest">
                      <th className="p-4 font-bold">เวลาที่จอง</th>
                      <th className="p-4 font-bold">หมายเลขโต๊ะ</th>
                      <th className="p-4 font-bold">ชื่อ-นามสกุล</th>
                      <th className="p-4 font-bold text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-sm text-slate-500">{new Date(b.created_at).toLocaleString('th-TH')}</td>
                        <td className="p-4 font-bold text-slate-900">{b.desk_id}</td>
                        <td className="p-4 font-medium text-slate-700">{b.user_name}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteBooking(b.id)} 
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          >
                            ยกเลิก
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Popup (แสดงเฉพาะมือถือเมื่อกดปุ่มเมนู) */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[100] flex items-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative">
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
            
            <button onClick={() => setShowMobileMenu(false)} className="absolute top-5 right-5 p-2 bg-slate-100 rounded-full text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold uppercase mb-1">{room.name}</h2>
              <p className="text-sm text-slate-500 font-mono tracking-widest">Join Code: {room.join_code}</p>
            </div>

            {/* สลับหน้าโหมด */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button 
                onClick={() => { setActiveTab('dashboard'); setShowMobileMenu(false); }} 
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                รายชื่อผู้จอง
              </button>
              <button 
                onClick={() => { setActiveTab('editor'); setShowMobileMenu(false); }} 
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'editor' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                จัดแผนผัง
              </button>
            </div>

            {/* ตั้งเวลาเปิดจอง (โชว์เฉพาะถ้าอยู่หน้า Editor) */}
            {activeTab === 'editor' && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ตั้งเวลาเปิดจอง
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1 p-3 rounded-lg border border-slate-300 text-base outline-none focus:border-indigo-500 bg-white font-bold text-slate-700 shadow-inner"
                  />
                  <button onClick={() => { handleSaveTime(); setShowMobileMenu(false); }} className="bg-slate-900 text-white px-5 rounded-lg font-bold uppercase shadow-md">Save</button>
                </div>
                {startTime && (
                  <button onClick={() => { handleClearTime(); setShowMobileMenu(false); }} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg uppercase tracking-wider text-sm border border-red-100 transition-colors">
                    ยกเลิกการตั้งเวลา
                  </button>
                )}
              </div>
            )}

            {/* ปุ่มกลับหน้าโฮม */}
            {onGoHome && (
              <button 
                onClick={() => { setShowMobileMenu(false); onGoHome(); }}
                className="w-full flex items-center justify-center gap-2 py-4 text-red-600 font-bold bg-red-50 rounded-xl uppercase tracking-wider"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> ออกจากระบบ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}