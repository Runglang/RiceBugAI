import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>RiceBugAI</h1>
      <h2>เข้าสู่ระบบ</h2>

      <Link href="/admin/login">Admin</Link>

      <Link href="/member/login">Member</Link>
      
      <Link href="/member/listinsects">List Insects</Link>
    </div>
  );
}
