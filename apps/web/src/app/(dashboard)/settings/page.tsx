import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { PreferencesSettings } from '@/components/settings/preferences-settings'
import { IntegrationsSettings } from '@/components/settings/integrations-settings'
import { BillingSettings } from '@/components/settings/billing-settings'
import { getUserProfile } from '@/lib/profile-data'
import { getServerSession } from '@/lib/server-session'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getServerSession()
  const { tab } = await searchParams
  const profile = session ? await getUserProfile(session.user.id) : null
  const defaultTab = [
    'profile',
    'preferences',
    'integrations',
    'billing',
  ].includes(tab ?? '')
    ? tab
    : 'profile'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings initialProfile={profile} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
