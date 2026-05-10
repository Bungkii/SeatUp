'use client'
import { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { DialogProvider, useDialog } from '@/components/DialogContext';

const ClassroomCanvas = dynamic(() => import('@/components/ClassroomCanvas'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-500">Loading Map...</div>
});

// แยกเนื้อหาออกมาเพื่อสามารถเรียกใช้ useDialog ได้
function BookingContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { showAlert } = useDialog();
  const searchParams = useSearchParams();
  const nameFromQuery = searchParams.get('name');

  const [room, setRoom] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [studentName, setStudentName] = useState(nameFromQuery || '');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null); // เก็บโต๊ะที่คลิกเลือกอยู่
  const [loading, setLoading] = useState(true);
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    let channel: any;

    const fetchData = async () => {
      const { data: roomData } = await supabase.from('rooms').select('*').or(`id.eq.${roomId},join_code.eq.${roomId.toUpperCase()}`).maybeSingle();
      if (roomData) {
        setRoom(roomData);

        const fetchBookings = async () => {
          // เพิ่ม id ลงไปในการดึงข้อมูล เพื่อใช้กรองเวลาข้อมูลถูกลบ (DELETE) แบบเรียลไทม์
          const { data: bookingData } = await supabase.from('bookings').select('id, desk_id, user_name').eq('room_id', roomData.id);
          if (bookingData) setBookings(bookingData);
        };
        await fetchBookings();

        // ระบบดักจับ Real-time ยัดข้อมูลใส่ State เองโดยไม่ต้องดึงใหม่จากฐานข้อมูล
        channel = supabase
          .channel(`public:bookings:${roomData.id}-${Date.now()}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `room_id=eq.${roomData.id}` }, (payload) => {
            setBookings(prev => [...prev, payload.new]); // นำคนจองใหม่ต่อท้ายได้เลย
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bookings', filter: `room_id=eq.${roomData.id}` }, (payload) => {
            setBookings(prev => prev.filter(b => b.id !== payload.old.id)); // ลบคนที่ยกเลิกออกทันที
          })
          .subscribe();
      }
      setLoading(false);
    };
    fetchData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId]);

  // เปลี่ยนชื่อแท็บเบราว์เซอร์ให้เป็นชื่อห้องอัตโนมัติ
  useEffect(() => {
    if (room?.name) {
      document.title = `${room.name} | SeatUp`;
    } else {
      document.title = "SeatUp";
    }
  }, [room]);

  // ระบบนับถอยหลัง
  useEffect(() => {
    if (!room?.start_time) return;
    const target = new Date(room.start_time).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance <= 0) {
        if (showOverlay) {
          setIsFadingOut(true);
          setTimeout(() => setShowOverlay(false), 500); // รอ Fade Out 500ms
        }
        return true;
      } else {
        setShowOverlay(true);
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
        return false;
      }
    };

    const isFinished = updateTimer();
    if (isFinished) return;

    const interval = setInterval(() => {
      if (updateTimer()) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.start_time, showOverlay]);

  const handleSeatClick = (deskLabel: string) => {
    const isBooked = bookings.some(b => b.desk_id === deskLabel);
    if (isBooked) return; // ถ้าจองแล้วกดไม่ได้
    setSelectedSeat(deskLabel); // เก็บค่าโต๊ะที่เลือก
  };

  const confirmBooking = async () => {
    if (!studentName.trim()) return showAlert('กรุณากรอกชื่อก่อนครับ');
    if (!selectedSeat) return showAlert('กรุณาเลือกที่นั่งบนแผนผัง');

    // เช็คว่าชื่อนี้เคยจองไปแล้วหรือยัง (จำกัดสิทธิ์ 1 คน 1 โต๊ะ)
    const hasBooked = bookings.some(b => b.user_name.trim().toLowerCase() === studentName.trim().toLowerCase());
    if (hasBooked) {
      return showAlert('ขออภัยครับ 1 ท่านสามารถจองได้เพียง 1 ที่นั่งเท่านั้น');
    }

    const { error } = await supabase.from('bookings').insert([{
      room_id: room.id,
      desk_id: selectedSeat,
      user_name: studentName,
    }]);

    if (error) {
      if (error.code === '23505') { // รหัส Error 23505 = ข้อมูลซ้ำ (Unique Violation)
        showAlert('ที่นั่งนี้ถูกจองตัดหน้าไปแล้ว');
      } else {
        showAlert('Error: ' + error.message);
      }
    } else {
      showAlert('จองที่นั่งสำเร็จ!');
      setSelectedSeat(null); // ไม่ต้องรีเฟรชหน้าจอแล้ว เพราะ Realtime จะอัปเดตแผนผังให้เอง
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">LOADING...</div>;

  return (
      <div className="h-[100dvh] bg-slate-50 text-slate-900 flex flex-col lg:flex-row overflow-hidden font-sans relative">
        
        {/* 1. ส่วนแผนผัง (ซ้าย) */}
        <div className="flex-1 relative p-0 lg:p-10 flex flex-col items-center w-full min-h-0 pb-24 lg:pb-10">
          <div className="w-full max-w-4xl flex flex-col items-center mb-2 lg:mb-12 mt-2 lg:mt-0 px-4 shrink-0">
             <div className="w-full h-2 bg-slate-300 rounded-full mb-2" />
             <span className="text-xs lg:text-sm font-bold tracking-widest text-slate-400">หน้าห้อง (กระดาน)</span>
          </div>
  
          {/* สถานะที่นั่งด้านบน */}
          <div className="flex gap-4 lg:gap-6 text-xs lg:text-sm font-bold mb-2 lg:mb-6 px-4 shrink-0">
             <div className="flex items-center gap-2"><div className="w-5 h-5 bg-[#DEFF9A] border-2 border-[#4ade80] rounded-md" /> โต๊ะว่าง</div>
             <div className="flex items-center gap-2"><div className="w-5 h-5 bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-md" /> จองแล้ว</div>
          </div>
  
          <div className="w-full max-w-[1000px] flex flex-col flex-1 relative lg:bg-white lg:p-6 lg:rounded-2xl lg:border border-slate-200 overflow-hidden min-h-0">
            <ClassroomCanvas 
              initialLayout={room.layout_config} 
              bookings={bookings} 
              onSave={handleSeatClick} // ส่งฟังก์ชันคลิกเลือกไป
              isReadOnly={true} 
            />
          </div>
        </div>
  
        {/* 2. เมนูรายละเอียดการจอง (ขวา) */}
        <div className="fixed bottom-0 left-0 w-full lg:static lg:w-[380px] shrink-0 bg-white text-slate-900 flex flex-col z-40 border-t lg:border-t-0 lg:border-l border-slate-200 pb-[env(safe-area-inset-bottom)] lg:pb-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] lg:shadow-none">
          {/* ซ่อน Header BOOKING SUMMARY บนมือถือเพื่อประหยัดพื้นที่ */}
          <div className="hidden lg:flex bg-slate-900 text-white p-4 lg:p-6 text-sm lg:text-lg font-black tracking-widest uppercase items-center gap-3 relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             <svg className="w-5 h-5 lg:w-6 lg:h-6 text-red-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             <span className="relative z-10">BOOKING SUMMARY</span>
          </div>
  
          <div className="p-3 lg:p-6 flex-grow flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3 lg:gap-0 relative z-30">
             
             {/* ปุ่ม Back สำหรับมือถือ แบบเล็กๆ */}
             <button onClick={() => router.push('/')} className="lg:hidden flex items-center justify-center p-3 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 rounded-lg shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </button>

             <div className="flex flex-row lg:flex-col items-center lg:items-stretch lg:mb-8 lg:space-y-4 shrink-0 lg:w-full gap-2 lg:gap-0">
                <div className="hidden lg:flex justify-between border-b pb-2">
                   <span className="text-slate-400">ห้องเรียน</span>
                   <span className="font-bold text-slate-900">{room?.name || 'กำลังโหลด...'}</span>
                </div>
                <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:border-b lg:pb-2 gap-0.5 lg:gap-0">
                   <span className="text-[10px] lg:text-sm text-slate-500 lg:text-slate-400 font-bold uppercase tracking-wider">โต๊ะที่เลือก</span>
                   <span className="text-red-600 font-black text-xl lg:text-xl leading-none">{selectedSeat || '-'}</span>
                </div>
                <div className="hidden lg:flex flex-col text-right lg:text-left lg:flex-row lg:justify-between lg:items-center lg:pt-2">
                   <span className="text-xs lg:text-sm text-slate-500 lg:text-slate-400 font-bold">ชื่อผู้จอง</span>
                   <span className="font-bold text-slate-900 text-sm lg:text-base">{studentName || '-'}</span>
                </div>
             </div>
  
             <button 
               onClick={confirmBooking}
               disabled={showOverlay}
               className="flex-1 lg:w-full shrink-0 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white py-3 lg:py-4 px-2 lg:px-0 rounded-lg font-bold text-sm lg:text-lg uppercase tracking-wide shadow-md shadow-red-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 whitespace-nowrap"
             >
               {showOverlay ? 'ยังไม่เปิดให้จอง' : 'ยืนยันการจอง'}
             </button>
             
             <button onClick={() => router.push('/')} className="hidden lg:flex mt-4 py-3 lg:py-0 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors items-center justify-center gap-2 w-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                กลับหน้าหลัก
             </button>
          </div>
        </div>
  
        {/* Overlay นับถอยหลังรอจอง */}
        {showOverlay && (
          <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'animate-in fade-in'}`}>
            <div className="text-center flex flex-col items-center z-10 px-4">
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-widest mb-2 md:mb-4 drop-shadow-lg">ยังไม่ถึงเวลาเปิดจอง</h2>
              <p className="text-slate-300 mb-6 md:mb-8 text-sm md:text-lg drop-shadow-md">ระบบจะเปิดให้เข้าจองที่นั่งได้ในอีก</p>
  
              {timeLeft && (
                <div className="flex gap-2 md:gap-4 text-white text-6xl md:text-8xl font-mono font-bold drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                  {timeLeft.h > 0 && (
                    <>
                      <span>{timeLeft.h.toString().padStart(2, '0')}</span>
                      <span className="text-slate-500/80 -mt-1">:</span>
                    </>
                  )}
                  <span>{timeLeft.m.toString().padStart(2, '0')}</span>
                  <span className="text-slate-500/80 -mt-1">:</span>
                  <span className="text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">{timeLeft.s.toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <DialogProvider>
      <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">LOADING...</div>}>
        <BookingContent roomId={resolvedParams.id} />
      </Suspense>
    </DialogProvider>
  )
}
