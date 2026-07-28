'use client'
import { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DialogProvider, useDialog } from '@/components/DialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const StyledConfirmButton = styled.button`
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  color: white;
  border-radius: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.3);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #94a3b8;
    box-shadow: none;
    transform: none;
    cursor: not-allowed;
  }
`;

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
  const [zones, setZones] = useState<any[]>([]);
  const [studentName, setStudentName] = useState(nameFromQuery || '');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null); // เก็บโต๊ะที่คลิกเลือกอยู่
  const [loading, setLoading] = useState(true);
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);
  const [queueStatus, setQueueStatus] = useState<'not_joined' | 'waiting' | 'active'>('active');
  const [queueRank, setQueueRank] = useState<number | null>(null);
  const [bookingEnded, setBookingEnded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [pendingZoneSeat, setPendingZoneSeat] = useState<{deskLabel: string, conditionText: string} | null>(null);
  
  // สถานะเพื่อรองรับการคำนวณคิวใหม่แบบ Real-time
  const [queueTime, setQueueTime] = useState<string | null>(null);
  const [triggerRecount, setTriggerRecount] = useState(0);

  useEffect(() => {
    // โหลดชื่อที่เคยเซฟไว้เบื้องต้น (ถ้ามี) เผื่อว่าเข้าด้วยลิงก์เดิม
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem(`jongtee_name_${roomId}`);
      if (savedName && !studentName) setStudentName(savedName);
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const roomData = await res.json();
        
        if (roomData) {
          setRoom(roomData);
          
          if (typeof window !== 'undefined') {
            const savedName = localStorage.getItem(`jongtee_name_${roomData.id}`);
            const savedRank = localStorage.getItem(`jongtee_rank_${roomData.id}`);
            const savedQueueTime = localStorage.getItem(`jongtee_queue_time_${roomData.id}`);
            if (savedName && !studentName) setStudentName(savedName);
            if (savedRank) {
              setQueueRank(parseInt(savedRank, 10));
              setQueueStatus('waiting');
            }
            if (savedQueueTime) {
              setQueueTime(savedQueueTime);
            }
          }

          const fetchBookings = async () => {
            const bRes = await fetch(`/api/bookings?roomId=${roomData.id}`);
            if (bRes.ok) {
              const bookingData = await bRes.json();
              setBookings(bookingData || []);
            }
          };
          const fetchZones = async () => {
            const zRes = await fetch(`/api/zones?roomId=${roomData.id}`);
            if (zRes.ok) {
              const zoneData = await zRes.json();
              setZones(zoneData || []);
            }
          };
          await Promise.all([fetchBookings(), fetchZones()]);
        }
      } catch (e) {
        console.error('Error fetching room data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  // Polling สำหรับอัปเดตข้อมูล bookings & queues เรียลไทม์
  useEffect(() => {
    if (!room?.id) return;
    const interval = setInterval(async () => {
      try {
        const bRes = await fetch(`/api/bookings?roomId=${room.id}`);
        if (bRes.ok) {
          const bookingData = await bRes.json();
          setBookings(bookingData || []);
        }
        setTriggerRecount(prev => prev + 1);
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [room?.id]);

  // Effect สำหรับคำนวณคิวใหม่แบบ Real-time เมื่อมีคนออกจากคิว (หรือจองเสร็จ)
  useEffect(() => {
    if (queueTime && room && queueStatus !== 'active') {
      const recount = async () => {
        try {
          const res = await fetch(`/api/queues?roomId=${room.id}&createdAt=${encodeURIComponent(queueTime)}`);
          if (res.ok) {
            const data = await res.json();
            const rank = (data.count || 0) + 1;
            setQueueRank(rank);
            localStorage.setItem(`jongtee_rank_${room.id}`, rank.toString());
          }
        } catch (e) {
          console.error('Queue recount error', e);
        }
      };
      recount();
    }
  }, [triggerRecount, queueTime, room, queueStatus]);

  // เปลี่ยนชื่อแท็บเบราว์เซอร์ให้เป็นชื่อห้องอัตโนมัติ
  useEffect(() => {
    if (room?.name) {
      document.title = `${room.name} | JongTee`;
    } else {
      document.title = "JongTee";
    }
  }, [room]);

  // ระบบคิวและนับถอยหลัง
  useEffect(() => {
    if (!room) return;

    const checkTime = () => {
      const now = new Date().getTime();
      
      // เช็คเวลาจบ
      if (room.end_time) {
        const end = new Date(room.end_time).getTime();
        if (now > end) {
          setBookingEnded(true);
          return true; // จบการทำงาน timer
        }
      }

      // เช็คเวลาเริ่มและระบบคิว
      if (room.start_time) {
        const start = new Date(room.start_time).getTime();
        const distance = start - now;
        
        if (now < start) {
          // ยังไม่ถึงเวลาเริ่ม
          if (queueStatus === 'active') {
             setQueueStatus('not_joined');
          }
          setShowOverlay(true);
          setTimeLeft({
            d: Math.floor(distance / (1000 * 60 * 60 * 24)),
            h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            s: Math.floor((distance % (1000 * 60)) / 1000),
          });
          return false;
        }

        // กรณีเลยเวลาเริ่มแล้ว (now >= start)
        if (queueStatus === 'not_joined') {
           setShowOverlay(true);
           setTimeLeft(null);
           return false;
        }

        // ระบบคิวแบบ Virtual Waiting Room (ปล่อยเข้าทีละ 4 + จำนวนคนที่จองเสร็จแล้ว)
        const allowedRank = 4 + bookings.length;

        if (queueRank && queueRank <= allowedRank) {
           if (queueStatus !== 'active') {
             if (showOverlay) {
               setIsFadingOut(true);
               setTimeout(() => {
                 setShowOverlay(false);
                 setQueueStatus('active');
               }, 500);
             } else {
               setQueueStatus('active');
             }
           }
           return false; 
        } else {
           setShowOverlay(true);
           setTimeLeft(null);
           return false;
        }
      }

      return false;
    };

    const isFinished = checkTime();
    if (isFinished) return;

    const interval = setInterval(() => {
      if (checkTime()) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [room, queueStatus, queueRank, showOverlay, bookings.length]);

  const joinQueue = async () => {
    if (!studentName.trim()) return showAlert('กรุณากรอกชื่อก่อนเข้าคิว');
    
    // Check if user already booked
    const hasBooked = bookings.some(b => b.user_name.trim().toLowerCase() === studentName.trim().toLowerCase());
    if (hasBooked) {
      return showAlert('ขออภัยครับ ชื่อนี้ได้ทำการจองที่นั่งไปแล้ว');
    }

    try {
      const res = await fetch('/api/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          user_name: studentName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join queue');
      
      const rankRes = await fetch(`/api/queues?roomId=${room.id}&createdAt=${encodeURIComponent(data.created_at)}`);
      const rankData = await rankRes.json();
      const rank = (rankData.count || 0) + 1;
        
      setQueueRank(rank);
      setQueueTime(data.created_at);
      setQueueStatus('waiting');
      
      // บันทึกลง Local Storage เผื่อผู้ใช้เผลอกดรีเฟรชหน้าจอ
      localStorage.setItem(`jongtee_name_${room.id}`, studentName.trim());
      localStorage.setItem(`jongtee_rank_${room.id}`, rank.toString());
      localStorage.setItem(`jongtee_queue_time_${room.id}`, data.created_at);
      
    } catch (error: any) {
      setIsBooking(false);
      showAlert('เกิดข้อผิดพลาดในการจอง: ' + error.message);
    }
  };

  const handleSeatClick = (deskLabel: string, zoneId?: string) => {
    if (isPreviewMode || queueStatus !== 'active') return showAlert('คุณกำลังอยู่ในโหมดดูแผนผังล่วงหน้า หรือยังไม่ถึงคิวของคุณ ไม่สามารถกดจองได้ครับ');
    
    const isBooked = bookings.some(b => b.desk_id === deskLabel);
    if (isBooked) return;
    
    if (zoneId && zones.length > 0) {
      const zone = zones.find(z => z.id === zoneId);
      if (zone && zone.condition_text) {
        setPendingZoneSeat({ deskLabel, conditionText: zone.condition_text });
        return;
      }
    }
    
    setSelectedSeat(deskLabel);
  };

  // === State สำหรับหน้ายืนยันการจอง (Confirmation Modal) ===
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{ deskId: string; userName: string; roomName: string; time: string } | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const confirmBooking = async () => {
    if (!studentName.trim()) return showAlert('กรุณากรอกชื่อก่อนครับ');
    if (!selectedSeat) return showAlert('กรุณาเลือกที่นั่งบนแผนผัง');
    if (isBooking) return;

    try {
      const hasBooked = bookings.some(b => b.user_name.trim().toLowerCase() === studentName.trim().toLowerCase());
      if (hasBooked) {
        return showAlert('ขออภัยครับ 1 ท่านสามารถจองได้เพียง 1 ที่นั่งเท่านั้น');
      }

      const seatTaken = bookings.some(b => b.desk_id === selectedSeat);
      if (seatTaken) {
        setSelectedSeat(null);
        return showAlert('ที่นั่งนี้ถูกจองไปแล้ว กรุณาเลือกที่นั่งอื่น');
      }

      setIsBooking(true);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          desk_id: selectedSeat,
          user_name: studentName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsBooking(false);
        if (data.code === '23505') {
          setSelectedSeat(null);
          showAlert('ที่นั่งนี้ถูกจองตัดหน้าไปแล้ว กรุณาเลือกที่นั่งอื่น');
        } else {
          showAlert('Error: ' + (data.error || 'Booking failed'));
        }
      } else {
        // ลบออกจากคิวเมื่อจองสำเร็จ
        await fetch(`/api/queues?roomId=${room.id}&userName=${encodeURIComponent(studentName.trim())}`, {
          method: 'DELETE',
        });

        const d = new Date();
        const timeString = d.toLocaleDateString('th-TH') + ' ' + d.toLocaleTimeString('th-TH');

        setConfirmedBooking({
          deskId: selectedSeat,
          userName: studentName.trim(),
          roomName: room?.name || 'Unknown Room',
          time: timeString,
        });
        setShowConfirmation(true);
        setSelectedSeat(null);
        setIsBooking(false);
      }
    } catch (err: any) {
      console.error(err);
      setIsBooking(false);
      showAlert('เกิดข้อผิดพลาดที่ไม่คาดคิด: ' + (err?.message || 'Unknown Error'));
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('booking-confirmation-card');
    if (!element) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `booking-${selectedSeat || 'ticket'}.png`;
      link.click();
    } catch (e) {
      console.error('Failed to generate image', e);
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
  
          <div className="w-full max-w-[1000px] flex flex-col flex-1 relative lg:bg-white lg:p-6 lg:rounded-2xl lg:border border-slate-200 overflow-hidden min-h-0 pb-32 lg:pb-0">
            <ClassroomCanvas 
              initialLayout={room.layout_config} 
              bookings={bookings} 
              zones={zones}
              onSave={handleSeatClick}
              isReadOnly={true} 
            />
          </div>
        </div>
  
        {/* 2. เมนูรายละเอียดการจอง (ขวา) */}
        <div className="fixed bottom-0 left-0 w-full lg:static lg:w-[380px] shrink-0 bg-white text-slate-900 flex flex-col z-40 border-t lg:border-t-0 lg:border-l border-slate-200 pb-[env(safe-area-inset-bottom)] lg:pb-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] lg:shadow-none">
          <div className="hidden lg:flex bg-slate-900 text-white p-4 lg:p-6 text-sm lg:text-lg font-black tracking-widest uppercase items-center gap-3 relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             <svg className="w-5 h-5 lg:w-6 lg:h-6 text-red-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             <span className="relative z-10">BOOKING SUMMARY</span>
          </div>
  
          <div className="p-3 lg:p-6 flex-grow flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3 lg:gap-0 relative z-30">
             
             {/* ปุ่ม Back สำหรับมือถือ */}
             <button onClick={() => router.push('/')} className="lg:hidden flex items-center justify-center p-3 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 rounded-lg shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </button>

             <div className="flex flex-row lg:flex-col items-center lg:items-stretch lg:mb-8 lg:space-y-4 shrink-0 lg:w-full gap-2 lg:gap-0">
                <div className="hidden lg:flex justify-between border-b pb-2">
                   <span className="text-slate-400">ห้องเรียน</span>
                   <span className="font-bold text-slate-900">{room?.name || 'กำลังโหลด...'}</span>
                </div>
                
                {/* ช่องกรอกชื่อผู้จอง */}
                <div className="flex flex-col lg:border-b lg:pb-3 w-full">
                   <label className="text-[10px] lg:text-sm text-slate-500 lg:text-slate-400 font-bold uppercase tracking-wider mb-1">ชื่อผู้จอง</label>
                   <input 
                     type="text"
                     value={studentName}
                     onChange={(e) => setStudentName(e.target.value)}
                     placeholder="กรอกชื่อ-นามสกุล"
                     className="w-full p-2 lg:p-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none font-bold text-slate-900 transition-all text-sm lg:text-base"
                   />
                </div>

                <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:border-b lg:pb-2 gap-0.5 lg:gap-0">
                   <span className="text-[10px] lg:text-sm text-slate-500 lg:text-slate-400 font-bold uppercase tracking-wider">โต๊ะที่เลือก</span>
                   <span className="text-red-600 font-black text-xl lg:text-xl leading-none">{selectedSeat || '-'}</span>
                </div>
             </div>
  
             <StyledConfirmButton 
               onClick={confirmBooking}
               disabled={showOverlay || isBooking}
               className="flex-1 lg:w-full shrink-0 py-3 lg:py-4 px-2 lg:px-0 text-sm lg:text-lg"
             >
               {isBooking ? 'กำลังจอง...' : showOverlay ? 'ยังไม่เปิดให้จอง' : 'ยืนยันการจอง'}
             </StyledConfirmButton>
             
             <button onClick={() => router.push('/')} className="hidden lg:flex mt-4 py-3 lg:py-0 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-900 transition-colors items-center justify-center gap-2 w-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                กลับหน้าหลัก
             </button>
          </div>
        </div>
  
        {/* Overlay จบการจอง */}
        <AnimatePresence>
          {bookingEnded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
            >
               <motion.div 
                 initial={{ scale: 0.9, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 className="text-center"
               >
                 <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-4">การจองสิ้นสุดลงแล้ว</h2>
                 <p className="text-slate-300 md:text-xl">ขออภัย หมดเวลาสำหรับการจองที่นั่งในรอบนี้</p>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay นับถอยหลังรอจอง */}
        <AnimatePresence>
          {showOverlay && queueStatus !== 'active' && !bookingEnded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed z-[60] flex flex-col items-center justify-center transition-all duration-500 ${isPreviewMode ? 'bottom-4 left-1/2 -translate-x-1/2 inset-auto w-auto rounded-2xl bg-black/90 p-4 shadow-2xl backdrop-blur-md' : 'inset-0 bg-black/85 backdrop-blur-md'}`}
            >
              <div className={`text-center flex flex-col items-center z-10 ${isPreviewMode ? 'px-2' : 'px-4 w-full'}`}>
                {queueStatus === 'not_joined' ? (
                   <motion.div 
                     initial={{ scale: 0.9, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     className="bg-white p-8 rounded-2xl max-w-sm w-full mx-auto shadow-2xl"
                   >
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-2">เตรียมตัวจอง</h2>
                      <p className="text-slate-500 text-sm mb-6">กรุณากรอกชื่อของคุณเพื่อเข้าสู่ห้องรอคิว</p>
                      <input 
                         type="text"
                         value={studentName}
                         onChange={(e) => setStudentName(e.target.value)}
                         placeholder="ชื่อของคุณ"
                         className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none font-bold text-center mb-4 text-slate-900 transition-all text-lg"
                      />
                      <button onClick={joinQueue} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-widest shadow-lg shadow-red-600/30 hover:-translate-y-1">
                         เข้าห้องรอคิว
                      </button>
                   </motion.div>
                ) : (
                   <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                   >
                    <h2 className={`${isPreviewMode ? 'text-sm md:text-base mb-1' : 'text-2xl md:text-4xl mb-2 md:mb-4'} font-black text-white uppercase tracking-widest drop-shadow-lg`}>
                      {queueRank ? `คิวลำดับที่ ${queueRank}` : 'กำลังรอเข้าห้อง'}
                    </h2>
                    
                    {timeLeft ? (
                      <>
                        {!isPreviewMode && <p className="text-slate-300 mb-6 md:mb-8 text-sm md:text-lg drop-shadow-md">ระบบจะเปิดให้เข้าจองที่นั่งได้ในอีก</p>}
            
                        <div className={`flex gap-2 md:gap-4 text-white font-mono font-bold drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] ${isPreviewMode ? 'text-2xl justify-center' : 'text-6xl md:text-8xl'}`}>
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
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        {!isPreviewMode && (
                          <p className="text-slate-300 mb-6 md:mb-8 text-sm md:text-lg drop-shadow-md text-center max-w-lg leading-relaxed">
                            กรุณารอสักครู่ ระบบจะทยอยให้ผู้ใช้เข้าจองที่นั่งตามลำดับคิว
                            เพื่อป้องกันระบบขัดข้อง<br/>
                            <span className="text-amber-400 text-xs md:text-sm mt-2 block font-bold">*หากคุณรีเฟรชหน้าจอ คิวของคุณจะไม่หาย*</span>
                          </p>
                        )}
                        <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-slate-600 border-t-red-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    {/* ปุ่มดูแผนผังล่วงหน้า */}
                    <button 
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className={`mt-6 md:mt-10 px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-slate-800 text-white hover:bg-slate-700 text-xs' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm'}`}
                    >
                      {isPreviewMode ? 'ย่อกลับไปรอคิว' : '👀 ดูแผนผังล่วงหน้า'}
                    </button>
                   </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== ZONE CONDITION MODAL ===== */}
        <AnimatePresence>
          {pendingZoneSeat && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
              >
                <div className="bg-indigo-600 p-6 text-center text-white">
                  <h3 className="text-xl font-black uppercase tracking-widest mb-1">เงื่อนไขการจองโซนนี้</h3>
                  <p className="text-indigo-200 text-sm">โต๊ะ: {pendingZoneSeat.deskLabel}</p>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                    {pendingZoneSeat.conditionText}
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPendingZoneSeat(null)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold uppercase text-sm hover:bg-slate-200 transition-colors"
                    >
                      ปฏิเสธ
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedSeat(pendingZoneSeat.deskLabel);
                        setPendingZoneSeat(null);
                      }}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-colors"
                    >
                      ยอมรับเงื่อนไข
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== BOOKING CONFIRMATION MODAL ===== */}
        <AnimatePresence>
          {showConfirmation && confirmedBooking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                id="booking-confirmation-card" 
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Header สีเขียว */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                </div>
                {/* Animated Checkmark */}
                <div className="relative z-10 mb-4 flex justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-in zoom-in duration-700">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider relative z-10">จองสำเร็จแล้ว!</h2>
                <p className="text-emerald-100 text-sm mt-1 relative z-10">Booking Confirmed</p>
              </div>

              {/* รายละเอียดการจอง */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><i className="bi bi-building"></i> ห้อง</span>
                    <span className="font-bold text-slate-900">{confirmedBooking.roomName}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><i className="bi bi-grid-1x2"></i> ที่นั่ง</span>
                    <span className="font-black text-3xl text-emerald-600">{confirmedBooking.deskId}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><i className="bi bi-person"></i> ชื่อผู้จอง</span>
                    <span className="font-bold text-slate-900">{confirmedBooking.userName}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><i className="bi bi-calendar-event"></i> วัน/เวลา</span>
                    <span className="font-medium text-slate-700 text-xs">{confirmedBooking.time}</span>
                  </div>
                </div>

                {/* รหัสอ้างอิง */}
                <div className="text-center py-2">
                  <span className="text-xs text-slate-400 font-mono tracking-widest">REF: {room?.join_code || (room?.id ? room.id.slice(0,8).toUpperCase() : 'N/A')}</span>
                </div>

                {/* คำแนะนำ */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-amber-700 text-xs font-bold">
                    <i className="bi bi-camera"></i> กรุณาบันทึกภาพนี้หรือแคปหน้าจอไว้เพื่อเป็นหลักฐาน
                  </p>
                </div>

                {/* ปุ่ม Action */}
                <div id="confirmation-action-buttons" className="flex flex-col gap-3">
                  <button
                    onClick={handleDownloadImage}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    บันทึกภาพหลักฐาน
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      router.push('/');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg uppercase tracking-wider shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    เข้าใจแล้ว ปิดหน้านี้
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 py-3 text-center border-t border-slate-100">
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">JongTee Booking System</span>
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
