import Link from "next/link";

export default function MemberDashboard() {
  return (
    <div className="min-h-screen bg-[#F3F5F1] p-6 pt-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Member Dashboard</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Welcome to your dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-gray-900 font-bold">ข้อมูลพื้นฐาน</h2>
              <p className="text-gray-500 text-sm">
                ดูข้อมูลเกี่ยวกับแมลงและสารเคมี
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/member/listinsects" className="w-full">
                <button className="w-full bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 py-2.5 px-6">
                  ดูข้อมูลแมลง
                </button>
              </Link>
              <Link href="/member/listchemicals" className="w-full">
                <button className="w-full bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 py-2.5 px-6">
                  ดูข้อมูลสารเคมี
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-gray-900 font-bold">จัดการแปลงนา</h2>
              <p className="text-gray-500 text-sm">
                เพิ่มและดูข้อมูลแปลงนาของคุณ
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/member/addfield" className="w-full">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] py-2.5 px-6">
                  เพิ่มแปลงนา
                </button>
              </Link>
              <Link href="/member/listfields" className="w-full">
                <button className="w-full bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 py-2.5 px-6">
                  ดูแปลงนา
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-gray-900 font-bold">การคำนวณ</h2>
              <p className="text-gray-500 text-sm">
                คำนวณและดูผลการคำนวณสารเคมี
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/member/calculation" className="w-full">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] py-2.5 px-6">
                  คำนวณสารเคมี
                </button>
              </Link>
              <Link href="/member/calculationresult" className="w-full">
                <button className="w-full bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 py-2.5 px-6">
                  ดูผลการคำนวณสารเคมี
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
