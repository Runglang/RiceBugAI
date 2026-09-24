import Link from 'next/link';

export default function MemberDashboard() {
    return (
        <div>
            <div>
                <h1>Member Dashboard</h1>
            </div>

            <div>
                <Link href="/member/listinsects">
                    <button>
                        ดูข้อมูลแมลง
                    </button>
                </Link>
            </div>
            <br />
            <div>
                <Link href="/member/listchemicals">
                    <button>
                        ดูข้อมูลสารเคมี
                    </button>
                </Link>
            </div>
              <div>
                <Link href="/member/addfield">
                    <button>
                        เพิ่มแปลงนา
                    </button>
                </Link>
            </div>
                  <div>
                <Link href="/member/listfields">
                    <button>
                        ดูแปลงนา
                    </button>
                </Link>
            </div>
                  <div>
                <Link href="/member/calculation">
                    <button>
                        คำนวณสารเคมี
                    </button>
                </Link>
            </div>
            <div>
                <Link href="/member/calculationresult">
                    <button>
                        ดูผลการคำนวณสารเคมี
                    </button>
                </Link>
            </div>
            
        </div>
    );
}