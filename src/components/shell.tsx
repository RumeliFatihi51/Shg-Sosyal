import { getUnreadNotificationCount } from "@/lib/data";
import { siteConfig } from "@/lib/env";
import { getCurrentProfile } from "@/lib/session";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { ShellFrame } from "@/components/shell-frame";
import { Toast } from "@/components/toast";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const unreadCount = await getUnreadNotificationCount(profile?.id);
  const showAdmin =
    profile && ["admin", "moderator", "teacher"].includes(profile.role);

  return (
    <ShellFrame
      profile={profile}
      unreadCount={unreadCount}
      showAdmin={showAdmin}
      displayName={siteConfig.displayName}
    >
      {children}
      <Toast />
      <PWAProvider signedIn={Boolean(profile)} />
    </ShellFrame>
  );
}
