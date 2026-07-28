'use client'
import { useState, useEffect } from 'react';
import { DialogProvider, useDialog } from '@/components/DialogContext';
import AdminPanel from '@/components/AdminPanel';
import RoomEditor from '@/components/RoomEditor';
import { Prompt } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

function PageContent() {
  const router = useRouter();
  const [view, setView] = useState<'landing' | 'host_menu' | 'host_create' | 'host_manage' | 'editor' | 'join'>('landing');
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  const [studentNameForJoin, setStudentNameForJoin] = useState('');
  const [manageCode, setManageCode] = useState('');
  const { showAlert } = useDialog();
  const [showDonation, setShowDonation] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    document.title = "JongTee | จองที่นั่งออนไลน์";
  }, []);

  const refetchEditingRoom = async () => {
    if (!editingRoom?.id) return;
    try {
      const res = await fetch(`/api/rooms/${editingRoom.id}`);
      const updatedRoom = await res.json();
      if (res.ok && updatedRoom) {
        setEditingRoom(updatedRoom);
      }
    } catch (e) {
      console.error('Failed to refetch room', e);
    }
  };

  const handleRoomCreated = (room: any) => {
    setEditingRoom(room);
    setView('editor');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return showAlert('กรุณากรอกข้อความก่อนส่งครับ');
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ส่งข้อความไม่สำเร็จ');

      showAlert('ส่งข้อความสำเร็จแล้ว!');
      setFeedbackText('');
      setShowFeedback(false);
    } catch (error: any) {
      showAlert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen flex flex-col justify-between p-4 md:p-10 relative overflow-hidden">
      
      {/* Background Decorator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-red-500/5 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center z-10">
        
        {/* Back Button when not in landing */}
        {view !== 'landing' && (
          <motion.button 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => { setView('landing'); setEditingRoom(null); }} 
            className={`${view === 'editor' ? 'hidden md:flex' : 'flex'} mb-6 text-slate-500 hover:text-slate-900 transition-colors font-bold items-center gap-2 w-fit bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            กลับหน้าหลัก
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center my-auto"
            >
              {/* Logo Section */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12"
              >
                <motion.div 
                  whileHover={{ rotate: 0, scale: 1.05 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 bg-slate-900 text-white rounded-2xl flex items-center justify-center transform -rotate-6 shadow-xl shadow-slate-900/20"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4M5 10h14M7 10V5a2 2 0 012-2h6a2 2 0 012 2v5" /></svg>
                </motion.div>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase text-slate-900">
                  JONG<span className="text-red-600 font-normal">TEE</span>
                </h1>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('host_menu')} 
                  className="p-6 md:p-8 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl hover:border-red-600 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-300 group text-left flex flex-col items-start"
                >
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 shrink-0 group-hover:bg-red-600 transition-colors shadow-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div className="text-2xl font-bold tracking-wide text-slate-900">จัดการห้อง</div>
                  <p className="text-slate-500 mt-2 font-medium">สร้างและจัดการแผนผังห้องเรียน</p>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('join')} 
                  className="p-6 md:p-8 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl hover:border-red-600 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-300 group text-left flex flex-col items-start"
                >
                  <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center mb-6 shrink-0 shadow-md shadow-red-600/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                  </div>
                  <div className="text-2xl font-bold tracking-wide text-slate-900">เข้าร่วมและจองที่นั่ง</div>
                  <p className="text-slate-500 mt-2 font-medium">กรอกโค้ดเพื่อเข้าจองที่นั่ง</p>
                </motion.button>
              </div>

              {/* Footer Links */}
              <div className="mt-16 md:mt-24 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-slate-500">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDonation(true)} 
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:border-amber-400 hover:text-amber-700 shadow-sm transition-all outline-none"
                >
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14h-3M14 20h6v-3M17 17h3" />
                  </svg>
                  เลี้ยงข้าวกูหน่อย
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFeedback(true)} 
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:border-indigo-400 hover:text-indigo-700 shadow-sm transition-all outline-none"
                >
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Feedback
                </motion.button>
              </div>
            </motion.div>
          )}

          {view === 'host_menu' && (
            <motion.div 
              key="host_menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto my-auto text-center w-full"
            >
              <h2 className="text-3xl font-black mb-8 text-slate-900 uppercase tracking-wide">เลือกเมนูจัดการห้องเรียน</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button 
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('host_create')} 
                  className="p-8 bg-white border border-slate-200/80 hover:border-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <svg className="w-12 h-12 text-slate-900 mb-4 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <div className="text-2xl font-bold text-slate-900">สร้างห้องเรียน</div>
                  <p className="text-slate-500 text-sm mt-2 font-medium">ออกแบบห้องและรับรหัสเข้าร่วม</p>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('host_manage')} 
                  className="p-8 bg-white border border-slate-200/80 hover:border-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <svg className="w-12 h-12 text-slate-900 mb-4 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  <div className="text-2xl font-bold text-slate-900">แผงควบคุม (Dashboard)</div>
                  <p className="text-slate-500 text-sm mt-2 font-medium">ดูรายชื่อผู้จองและแก้ไขแผนผัง</p>
                </motion.button>
              </div>
            </motion.div>
          )}

          {view === 'host_create' && (
            <motion.div 
              key="host_create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full my-auto"
            >
              <AdminPanel onCreated={handleRoomCreated} />
            </motion.div>
          )}

          {view === 'host_manage' && (
            <motion.div 
              key="host_manage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto my-auto text-center w-full bg-white p-8 md:p-10 border border-slate-200 rounded-2xl shadow-xl"
            >
              <h2 className="text-2xl font-black mb-2 text-slate-900 uppercase">เข้าสู่ระบบจัดการ</h2>
              <p className="text-slate-500 mb-6 text-sm">กรอกรหัสห้อง (Join Code) 6 หลัก</p>
              <input 
                type="text" 
                maxLength={6}
                value={manageCode}
                onChange={(e) => setManageCode(e.target.value.toUpperCase())}
                className="w-full text-center text-3xl md:text-4xl font-mono py-4 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 shadow-inner outline-none transition-all mb-8 uppercase text-slate-900 tracking-wider"
                placeholder="XXXXXX"
              />
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  if (!manageCode.trim()) return showAlert('กรุณากรอกรหัสห้อง');
                  try {
                    const res = await fetch(`/api/rooms?join_code=${encodeURIComponent(manageCode)}`);
                    const data = await res.json();
                    if (res.ok && data) {
                      setEditingRoom(data);
                      setView('editor');
                    } else showAlert('ไม่พบรหัสห้องนี้ครับ');
                  } catch (e) {
                    showAlert('เกิดข้อผิดพลาดในการดึงข้อมูล');
                  }
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg uppercase transition-colors shadow-lg"
              >
                เข้าสู่ระบบจัดการ
              </motion.button>
            </motion.div>
          )}

          {view === 'editor' && editingRoom && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col relative w-full"
            >
              <div className="hidden md:flex bg-slate-900 text-white p-6 rounded-2xl mb-6 flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                <div className="w-full">
                  <h2 className="text-2xl font-black uppercase tracking-wide">{editingRoom.name}</h2>
                  <p className="text-slate-400 text-sm mt-1 tracking-widest">รหัสลับเข้าร่วม: <span className="font-mono font-bold text-white text-lg ml-1 bg-slate-800 px-3 py-1 rounded-md">{editingRoom.join_code}</span></p>
                </div>
              </div>
              <RoomEditor room={editingRoom} onDataChange={refetchEditingRoom} onGoHome={() => { setView('landing'); setEditingRoom(null); }} />
            </motion.div>
          )}

          {view === 'join' && (
             <motion.div 
               key="join"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
               className="max-w-md mx-auto my-auto text-center w-full bg-white p-8 md:p-10 border border-slate-200 rounded-2xl shadow-xl"
             >
               <h2 className="text-2xl font-black mb-6 text-slate-900 uppercase">เข้าร่วมห้องเรียน</h2>
               <div className="space-y-4 mb-8">
                 <input 
                   type="text" 
                   value={studentNameForJoin}
                   onChange={(e) => setStudentNameForJoin(e.target.value)}
                   className="w-full text-center p-4 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:ring-4 focus:ring-red-600/10 shadow-inner outline-none transition-all text-slate-900 font-bold text-lg"
                   placeholder="กรอกชื่อของคุณ"
                 />
                 <input 
                   type="text" 
                   maxLength={6}
                   value={joinCode}
                   onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                   className="w-full text-center text-3xl md:text-4xl font-mono py-4 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:ring-4 focus:ring-red-600/10 shadow-inner outline-none transition-all uppercase text-slate-900 tracking-wider"
                   placeholder="XXXXXX"
                 />
               </div>
               <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!studentNameForJoin.trim()) return showAlert('กรุณากรอกชื่อของคุณก่อนครับ');
                    if (!joinCode.trim()) return showAlert('กรุณากรอกรหัสห้องก่อนครับ');
                    try {
                      const res = await fetch(`/api/rooms?join_code=${encodeURIComponent(joinCode)}`);
                      const data = await res.json();
                      if (res.ok && data?.id) router.push(`/room/${data.id}?name=${encodeURIComponent(studentNameForJoin)}`);
                      else showAlert('ไม่พบรหัสห้องนี้ครับ');
                    } catch (e) {
                      showAlert('เกิดข้อผิดพลาดในการดึงข้อมูล');
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg uppercase transition-colors shadow-lg shadow-red-600/20"
               >
                 เข้าร่วมจองโต๊ะ
               </motion.button>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popup โดเนท */}
      <AnimatePresence>
        {showDonation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" 
            onClick={() => setShowDonation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative" 
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowDonation(false)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors outline-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform -rotate-6">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14h-3M14 20h6v-3M17 17h3" /></svg>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-wide">สแกนเพื่อเลี้ยงข้าวกู</h3>
              <p className="text-slate-500 text-sm mb-6">สนับสนุนการพัฒนาและเป็นดอกเบี้ยให้กุ</p>
              
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 mb-6 inline-block shadow-sm">
                <img src="https://promptpay.io/0925384159.png" alt="PromptPay QR" className="w-48 h-48 mx-auto" />
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ชื่อผู้รับเงิน (PromptPay)</p>
                <p className="text-xl font-black text-slate-800">บุ้งกี๋ 🤩🤩</p>
                <p className="text-sm font-bold text-slate-500 mt-1 font-mono">092-538-4159</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup ส่ง Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" 
            onClick={() => setShowFeedback(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center relative" 
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowFeedback(false)} className="absolute top-5 right-5 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors outline-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-wide">ส่งคำชมไม่ให้ติ</h3>
              <p className="text-slate-500 text-sm mb-6">ข้อเสนอแนะแต่กุไม่ฟังหรอก</p>
              
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="พิมพ์ข้อความของคุณที่นี่..."
                className="w-full h-32 p-4 mb-6 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 outline-none resize-none text-sm md:text-base text-slate-700 font-medium"
              ></textarea>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white py-4 rounded-xl font-bold uppercase transition-colors tracking-widest shadow-md shadow-indigo-600/20 disabled:shadow-none"
              >
                {isSubmittingFeedback ? 'กำลังส่ง...' : 'ส่งข้อความ'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function LandingPage() {
  return (
    <DialogProvider>
      <main className={`${prompt.className} flex flex-col min-h-[100dvh]`}>
        <PageContent />
        <footer className="w-full py-5 text-center text-xs font-bold tracking-wider text-slate-400 bg-slate-100 border-t border-slate-200 mt-auto">
          ห้อง 1 ห้ามใช้ แบน
        </footer>
      </main>
    </DialogProvider>
  );
}
