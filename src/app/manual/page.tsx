'use client';

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-white text-[#333333] font-sans">
      <div className="max-w-[720px] mx-auto py-[60px] px-6 leading-[1.7]">
        <header className="flex justify-between items-start flex-wrap gap-4 mb-10">
          <div>
            <h1 className="text-[2rem] font-semibold text-[#111] mb-2">คู่มือการใช้งาน Kanbann</h1>
            <p className="text-[1rem] text-[#666666]">ระบบจดการบ้าน ทวงงาน และจัดการชีวิตประจำวันของห้อง ม.2/3</p>
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
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">1. หน้าแรก (Home Page)</h2>
          <p className="mb-4 text-[0.95rem]">เมื่อเข้ามายังเว็บไซต์ คุณจะพบกับหน้าจอหลักที่แบ่งออกเป็นสัดส่วน:</p>
          <ol className="list-decimal pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">"หน้าสำหรับคนจดงาน" (ซ้าย):</strong> สำหรับเข้าไปเพิ่มงานใหม่ (สิทธิ์เฉพาะบุคคล)</li>
            <li><strong className="text-[#111] font-semibold">"พริมง่วงทวงบุญคุณ" (ขวา):</strong> เข้าสู่หน้า <strong className="text-[#111] font-semibold">กระดานงานหลัก (Kanban Board)</strong> เพื่อเช็คงานทั้งหมด</li>
            <li><strong className="text-[#111] font-semibold">ปุ่ม "จัดการข้อความ LINE":</strong> สั่งส่งข้อความหรือสร้างโพลเข้ากลุ่ม LINE</li>
            <li><strong className="text-[#111] font-semibold">ปุ่ม "เข้าสู่ระบบ":</strong> ล็อกอินเพื่อสิทธิ์ในการแก้ไขงานบนกระดาน</li>
          </ol>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">2. หน้ากระดานเช็คงาน (Kanban Board)</h2>
          <p className="mb-4 text-[0.95rem]">พื้นที่หลักสำหรับตรวจสอบงานค้างและติดตามความคืบหน้า (เข้าถึงที่ <code className="font-mono bg-[#f9f9f9] px-1.5 py-0.5 rounded text-[0.85em] text-[#333] border border-[#eaeaea]">/kanban</code>)</p>

          <div className="bg-[#f9f9f9] border-l-[3px] border-[#ccc] py-3 px-4 text-[0.875rem] text-[#555] my-4 rounded-r">
            <strong className="text-[#111] font-semibold">หมายเหตุ:</strong> การปรับสถานะงาน (เช่น ติ๊ก "เสร็จแล้ว") หรือลบงานออกจากกระดาน จะมีผลเฉพาะในหน้าจอเครื่องของคุณเท่านั้น ไม่กระทบกับผู้ใช้อื่น
          </div>

          <h3 className="text-[1.05rem] font-semibold mt-6 mb-3 text-[#222]">รูปแบบการแสดงผล</h3>
          <ul className="list-disc pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">มุมมองกระดาน (Board View):</strong> แบ่งคอลัมน์ (ต้องทำ, กำลังทำ, เสร็จแล้ว) รองรับการลากและวาง (Drag &amp; Drop)</li>
            <li><strong className="text-[#111] font-semibold">มุมมองติ๊ก (List View):</strong> แสดงเป็นรายการยาว สามารถกดติ๊กถูกด้านหน้าเพื่องานเปลี่ยนสถานะเป็นเสร็จสิ้น</li>
            <li><strong className="text-[#111] font-semibold">มุมมองหมวดหมู่ (Category View):</strong> ระบบจัดกลุ่มให้อัตโนมัติ เช่น งานเลยกำหนด, งานส่งภายใน 7 วัน, และแยกตามรายวิชา</li>
          </ul>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">3. การเพิ่มงาน &amp; การแก้ไข</h2>
          <p className="mb-4 text-[0.95rem]">สามารถบันทึกงานใหม่ได้ที่ <code className="font-mono bg-[#f9f9f9] px-1.5 py-0.5 rounded text-[0.85em] text-[#333] border border-[#eaeaea]">/add</code> โดยข้อมูลที่จำเป็นต้องกรอก (บังคับ) ได้แก่ ชื่อวิชา, กำหนดส่ง และรายละเอียดงาน</p>

          <ul className="list-disc pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">ข้อมูลเสริมที่ระบุได้:</strong> ครูผู้สั่ง, วิธีการส่งงาน, และการแนบไฟล์รูปภาพ</li>
            <li><strong className="text-[#111] font-semibold">การแก้ไขงาน:</strong> ไปที่หน้ากระดาน คลิกเปิดงานที่ต้องการ แล้วเลือก "แก้ไข" (จำเป็นต้องเข้าสู่ระบบก่อน)</li>
          </ul>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4 text-[#111] border-b border-[#eaeaea] pb-2">4. การจัดการข้อความ LINE</h2>
          <p className="mb-4 text-[0.95rem]">ระบบแจ้งเตือนและสั่งการบอท LINE เข้ากลุ่มห้อง (เข้าถึงที่ <code className="font-mono bg-[#f9f9f9] px-1.5 py-0.5 rounded text-[0.85em] text-[#333] border border-[#eaeaea]">/line</code>)</p>
          <ul className="list-disc pl-6 mb-4 text-[0.95rem] space-y-2">
            <li><strong className="text-[#111] font-semibold">สร้างโพล (Custom Poll):</strong> ตั้งคำถามและเพิ่มตัวเลือกได้สูงสุด 10 ข้อ กำหนดเวลาปิดโหวตได้อิสระ</li>
            <li><strong className="text-[#111] font-semibold">ส่งข้อความด่วน:</strong> ใช้รูปแบบข้อความสำเร็จรูปที่ตั้งค่าไว้แล้วเพื่อความรวดเร็ว</li>
            <li><strong className="text-[#111] font-semibold">ส่งข้อความกำหนดเอง:</strong> พิมพ์ประกาศใดๆ และให้ระบบส่งเข้ากลุ่ม</li>
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
            <p className="mt-6 text-[0.85rem] text-[#666666] mb-0">&copy; Kanbann</p>
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
