import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div>
            <h1>Admin Dashboard</h1>

            <Link href="/admin/addinsect">
                <button>
                    เพิ่มข้อมูลแมลง
                </button>
            </Link>
            <br />
            <Link href="/admin/listadmininsects">
                <button>
                    จัดการข้อมูลแมลง
                </button>
            </Link>
            <br />
            <Link href="/admin/addchemical">
                <button>
                    เพิ่มข้อมูลสารเคมี
                </button>
            </Link>
            <br />
            <Link href="/admin/listadminchemicals">
                <button>
                    จัดการข้อมูลสารเคมี
                </button>
            </Link>
        </div>
    );
}