# แผนการปรับปรุงระบบ Notification ของ RiceBugAI Frontend

## สถานะปัจจุบัน

โปรเจกต์ยังไม่มีระบบ Toast/Notification กลาง ใช้รูปแบบ Notification ที่ต่างกัน 4 แบบ:

| แบบ | หน้าที่ใช้ | ปัญหา |
|-----|-----------|-------|
| `alert()` / `confirm()` | listadmininsects, listadminchemicals, member/dashboard | ไม่สวย, blocking, ไม่ตรงกับ UI ของโปรเจกต์ |
| Inline banner `{state, message}` | addinsect, editinsect, addchemical, editchemical | ใช้งานได้ดี แต่ไม่มี dismiss, ไม่ auto-clear |
| Inline banner แยก error/success state | editprofile, editfield, admin/dashboard | ค่อนข้างดี แต่ styling ต่างกัน |
| Redirect ทันทีโดยไม่แสดง success | addfield, login (admin+member), calculation | ผู้ใช้ไม่รู้ว่าสำเร็จ |

### ปัญหาหลักที่ต้องแก้
1. **3 × `alert()`** — ลบข้อมูลผิดพลาด (admin insect list, admin chemical list, member dashboard)
2. **3 × `window.confirm()`** — ยืนยันก่อนลบ (เปลี่ยนเป็น Custom Dialog ตามแบบ admin/dashboard ที่มีอยู่แล้ว)
3. **5 × Silent success** — ลบสำเร็จแต่ไม่แสดงอะไร, redirect โดยไม่บอก
4. **ไม่มี auto-dismiss** — banner ค้างจนกว่าจะกดปิดหรือ navigate ออก

---

## แผนการดำเนินงาน

### ขั้นตอนที่ 1: สร้าง Toast Notification Component กลาง

**สร้างไฟล์ใหม่ 2 ไฟล์:**

1. **`app/components/shared/ToastContext.tsx`** — React Context + Provider
   - ใช้ `createContext` + `useContext` + `useState`
   - ไม่ติดตั้ง library ใหม่ — ใช้ React + Tailwind ที่มีอยู่
   - รองรับ 4 สถานะ: `success` (เขียว), `error` (แดง), `warning` (ส้ม), `info` (น้ำเงิน)
   - ใช้ไอคอนจาก `lucide-react` ที่มีอยู่แล้ว: `CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Info`
   - ใช้สีจาก palette เดิมของโปรเจกต์:
     - Success: `bg-[#E8F5EC]`, `border-[#B7DFC6]`, `text-[#1E7B45]`
     - Error: `bg-[#FDECEA]`, `border-[#F4B9B3]`, `text-[#B42318]`
     - Warning: `bg-[#FEF3CD]`, `border-[#F5D780]`, `text-[#856404]`
     - Info: `bg-[#E3F2FD]`, `border-[#90CAF9]`, `text-[#1565C0]`
   - แสดงตำแหน่ง **มุมขวาบน** (`fixed top-4 right-4 z-50`)
   - Auto-dismiss หลัง ~3 วินาที (สำหรับ success/info/warning)
   - Error ไม่ auto-dismiss — ต้องกดปิดเอง (เพราะ error สำคัญ ผู้ใช้ต้องอ่าน)
   - ปุ่มกดปิดด้วยตนเอง (✕) ทุกประเภท
   - รองรับหลายข้อความพร้อมกัน (stack จากบนลงล่าง)
   - ไม่บังปุ่มสำคัญ (ใช้ `pointer-events-none` บน container, `pointer-events-auto` บน toast)

2. **`app/components/shared/ConfirmDialog.tsx`** — Reusable Confirmation Dialog
   - ใช้รูปแบบเดียวกับ Modal ใน `admin/dashboard/page.tsx` ที่มีอยู่แล้ว
   - รับ props: `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`, `isLoading`
   - ใช้ styling เดิมของโปรเจกต์: overlay `bg-[#1A1F1C]/75`, card ขาวมุมมน, ปุ่มแดง

### ขั้นตอนที่ 2: ติดตั้ง Provider ใน Layout

**แก้ไข 1 ไฟล์:**

- **`app/layout.tsx`** — ครอบ `{children}` ด้วย `<ToastProvider>` 
  - เป็นจุดเดียวที่ Toast แสดง ครอบคลุมทุกหน้า
  - ไม่เปลี่ยน layout structure, font, color, หรือ styling อื่น

### ขั้นตอนที่ 3: แทนที่ `alert()` ด้วย Toast

**แก้ไข 3 ไฟล์:**

| ไฟล์ | เปลี่ยนจาก | เปลี่ยนเป็น |
|------|-----------|------------|
| `admin/listadmininsects/page.tsx` | `alert(err.message)` | `toast.error(err.message)` |
| `admin/listadminchemicals/page.tsx` | `alert(err.message)` | `toast.error(err.message)` |
| `member/dashboard/page.tsx` | `alert(err.message)` | `toast.error(err.message)` |

### ขั้นตอนที่ 4: แทนที่ `window.confirm()` ด้วย ConfirmDialog

**แก้ไข 3 ไฟล์เดิมจากขั้นตอนที่ 3:**

| ไฟล์ | เปลี่ยนจาก | เปลี่ยนเป็น |
|------|-----------|------------|
| `admin/listadmininsects/page.tsx` | `window.confirm(...)` | `<ConfirmDialog>` component |
| `admin/listadminchemicals/page.tsx` | `window.confirm(...)` | `<ConfirmDialog>` component |
| `member/dashboard/page.tsx` | `window.confirm(...)` | `<ConfirmDialog>` component |

### ขั้นตอนที่ 5: เพิ่ม Toast สำหรับ silent success

**แก้ไข 3 ไฟล์เดิม + เพิ่ม toast success ให้ลบสำเร็จ:**

| ไฟล์ | สถานะเดิม | เพิ่ม |
|------|----------|------|
| `admin/listadmininsects/page.tsx` | ลบสำเร็จ = silent | `toast.success('ลบข้อมูลแมลงสำเร็จ')` |
| `admin/listadminchemicals/page.tsx` | ลบสำเร็จ = silent | `toast.success('ลบข้อมูลสารเคมีสำเร็จ')` |
| `member/dashboard/page.tsx` | ลบสำเร็จ = silent | `toast.success('ลบข้อมูลแปลงนาสำเร็จ')` |

---

## หน้าที่ไม่จำเป็นต้องแก้ไข

| หน้า | เหตุผล |
|------|--------|
| `admin/addinsect`, `admin/editinsect` | Inline `{state, message}` banner ใช้งานได้ดี อยู่ในหน้าเดียว ไม่ redirect |
| `admin/addchemical`, `admin/editchemical` | เหมือนกัน — inline banner เหมาะสมกับ form ที่อยู่หน้าเดียว |
| `admin/dashboard` | มี custom modal + dismissable banner อยู่แล้ว — เป็นต้นแบบที่ดีที่สุดในโปรเจกต์ |
| `member/editprofile` | มี success/error banner + dismiss + clear-on-edit อยู่แล้ว — ใช้งานได้ดี |
| `member/login`, `admin/login` | Redirect ทันทีหลัง login — แสดง toast จะกระพริบแล้วหายไป ไม่มีประโยชน์ |
| `member/register` | มี success banner + auto-redirect 1.8s อยู่แล้ว — เหมาะสม |
| `member/editfield` | มี success banner + auto-redirect 1s อยู่แล้ว — เหมาะสม |
| `member/addfield` | Redirect ทันที — ข้อมูลแปลงใหม่ปรากฏในหน้า dashboard ทันที ถือว่ามี feedback |
| `member/calculation` | Redirect ไปหน้าผลลัพธ์ — หน้าผลลัพธ์เป็น feedback ในตัว |
| `member/analysisinsect` | แสดงผลวิเคราะห์ inline — เป็น feedback ในตัว |
| หน้า read-only ทั้งหมด | ไม่มี CRUD — ไม่ต้องแจ้งเตือน |

---

## สรุปไฟล์ที่จะเปลี่ยนแปลง

### สร้างใหม่ (2 ไฟล์)
1. `app/components/shared/ToastContext.tsx`
2. `app/components/shared/ConfirmDialog.tsx`

### แก้ไข (4 ไฟล์)
1. `app/layout.tsx` — เพิ่ม `<ToastProvider>`
2. `app/admin/listadmininsects/page.tsx` — แทนที่ `alert()` + `confirm()` + เพิ่ม delete success toast
3. `app/admin/listadminchemicals/page.tsx` — แทนที่ `alert()` + `confirm()` + เพิ่ม delete success toast
4. `app/member/dashboard/page.tsx` — แทนที่ `alert()` + `confirm()` + เพิ่ม delete success toast

### ไม่แก้ไข
- Backend, Database, API ใดๆ
- Layout หลัก, Header, Sidebar, Footer, Theme, Font
- หน้า Login, Register, Profile, Analysis, Calculation, Add/Edit form
- หน้า read-only (list, view, public pages)
