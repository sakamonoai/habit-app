import BottomNav from '@/components/BottomNav'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <PushNotificationPrompt />
      <BottomNav />
    </>
  )
}
