import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MemberNav from '@/components/MemberNav'
import SessionGuard from '@/components/SessionGuard'
import TapEffect from '@/components/TapEffect'
import SplashScreen from '@/components/SplashScreen'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: member } = await service
    .from('members')
    .select('full_name, status, membership_type')
    .eq('email', user.email!)
    .single()

  // Pending: show waiting screen (accessible on all routes so they can sign out from /card)
  if (!member || member.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Application Under Review</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">
            Your membership application is being reviewed by the secretariat. You will receive an email once it has been approved.
          </p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm text-gray-400 underline"
          >
            Sign out
          </button>
        </form>
      </div>
    )
  }

  // Inactive: deactivated account
  if (member.status === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Membership Deactivated</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">
            Your membership has been deactivated. Please contact the secretariat for assistance.
          </p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-sm text-gray-400 underline">Sign out</button>
        </form>
      </div>
    )
  }

  // Active (or expired — allow access but pages can show renewal notice)
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SplashScreen />
      <TapEffect />
      <SessionGuard />
      <main className="flex-1 pb-20">{children}</main>
      <MemberNav />
    </div>
  )
}
