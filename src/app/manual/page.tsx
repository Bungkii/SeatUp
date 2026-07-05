'use client';

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans">
      <div className="max-w-[720px] mx-auto py-[60px] px-6 leading-[1.7]">
        <header className="flex justify-between items-start flex-wrap gap-4 mb-10">
          <div>
            <h1 className="text-[2rem] font-semibold text-[#111] mb-2">คู่มือการใช้งาน JONGTEE</h1>
            <p className="text-[1rem] text-[#666666]">ระบบจองที่นั่งและจัดการห้องเรียน (SeatUp)</p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="inline-flex items-center gap-2 bg-[#111] text-white py-2 px-4 rounded text-sm font-medium border border-transparent hover:bg-black transition-all print:hidden cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            บันทึกเป็น PDF
          </button>
        </header>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">1. หน้าแรก (Booking Page)</h2>
          <p className="mb-4 text-[0.95rem]">เมื่อผู้ใช้เข้าผ่านลิงก์ที่ถูกแชร์มา จะพบกับหน้าจอสำหรับจองที่นั่ง:</p>
          <ol className="list-decimal pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">แผนผังที่นั่ง:</strong> แสดงโต๊ะและที่นั่งทั้งหมดในห้อง สีเทาหมายถึงว่าง สีแดงหมายถึงถูกจองแล้ว</li>
            <li><strong className="text-[#111] font-semibold">การเลือกที่นั่ง:</strong> คลิกที่โต๊ะว่างเพื่อเลือก ระบบจะขึ้นฟอร์มให้กรอกชื่อยืนยัน</li>
            <li><strong className="text-[#111] font-semibold">เวลาเปิด-ปิด:</strong> หากยังไม่ถึงเวลาเปิด หรือหมดเวลาจองแล้ว ระบบจะไม่อนุญาตให้กดจองที่นั่ง</li>
          </ol>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">2. ระบบเข้าคิว (Queue System)</h2>
          <p className="mb-4 text-[0.95rem]">หากแอดมินตั้งเวลาเปิดจองล่วงหน้า ระบบจะเปิดให้รับคิวแบบเรียลไทม์ (เหมือนกดบัตรคอนเสิร์ต):</p>
          <ul className="list-disc pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">การเข้าคิว:</strong> ผู้ใช้กรอกชื่อเพื่อเข้าคิวรอ ระบบจะรันหมายเลขคิวให้อัตโนมัติตามลำดับก่อน-หลัง</li>
            <li><strong className="text-[#111] font-semibold">การปล่อยคิว:</strong> เมื่อถึงเวลาเปิดจอง ระบบจะทยอยปล่อยคนเข้าจองที่นั่งทีละคิว (เว้นระยะห่างคิวละ 5 วินาที) เพื่อป้องกันระบบล่ม</li>
            <li><strong className="text-[#111] font-semibold">หน้าจอนับถอยหลัง:</strong> จะแสดงเวลานับถอยหลังก่อนที่ผู้ใช้แต่ละคนจะสามารถเข้าถึงแผนผังที่นั่งได้</li>
          </ul>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">3. หน้าแอดมิน (Admin Dashboard)</h2>
          <p className="mb-4 text-[0.95rem]">พื้นที่สำหรับจัดการระบบและตั้งค่าห้องเรียน (เฉพาะผู้ดูแล)</p>
          <ul className="list-disc pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">จัดการแผนผัง:</strong> สามารถสร้าง เพิ่ม และลบโต๊ะ-ที่นั่งได้อิสระ</li>
            <li><strong className="text-[#111] font-semibold">ตั้งเวลาเปิด/ปิด:</strong> กำหนดเวลาเริ่มจอง (Start Time) และเวลาสิ้นสุด (End Time)</li>
            <li><strong className="text-[#111] font-semibold">แชร์ลิงก์:</strong> กดปุ่ม "แชร์ลิ้งก์จอง" เพื่อคัดลอกลิงก์ส่งให้ผู้ใช้งานได้ทันที</li>
          </ul>
        </section>

        <footer className="mt-14 pt-6 border-t border-[#eaeaea] text-[0.875rem] text-[#666666] flex flex-wrap justify-between items-end gap-6 print:mt-8">
          <div className="flex-1 min-w-[200px]">
            <h3 className="mt-0 mb-3 text-[1rem] text-[#111] font-semibold">สนับสนุนการพัฒนา</h3>
            <a href="https://ezdn.app/Bungkii88888" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#111] text-white py-2.5 px-4 rounded-md no-underline font-medium print:hidden hover:bg-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20"></path>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              โดเนทเด็กชายบุ้งกี๋
            </a>
            <p className="mt-6 text-[0.85rem] text-[#666666] mb-0">&copy; JONGTEE</p>
          </div>
          <div className="flex-1 min-w-[300px] flex justify-end print:hidden">
             <iframe
                src="https://widgets.easydonate.app?w=leaderboard&u=sx6uqk3osnikyl09f9oreie6&t=3a0476242f3ed406c2bb6d4a374ec7c3&ts=1782016564160"
                width="100%" height="250" frameBorder="0"
                className="max-w-[350px] rounded-lg border border-[#eaeaea] bg-[#f9f9f9]"
             ></iframe>
          </div>
        </footer>
      </div>
    </div>
  );
}
