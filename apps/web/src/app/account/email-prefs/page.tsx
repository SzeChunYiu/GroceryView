import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const myFlyerEmailPreference = {
  endpoint: '/api/settings',
  field: 'notification_preferences.myFlyerWeeklyEmail',
  countryField: 'notification_preferences.myFlyerCountry',
  defaultCountry: 'se',
  schedule: 'Monday 06:00 per selected country',
  storesIn: 'user_preferences.notification_preferences',
  sender: '.github/workflows/weekly-digest.yml'
};

const emailPreferencesScript = `(() => {
  const form = document.querySelector('[data-my-flyer-email-preferences]');
  if (!form) return;

  const status = form.querySelector('[data-my-flyer-email-status]');
  const checkbox = form.querySelector('[data-my-flyer-email-checkbox]');
  const country = form.querySelector('[data-my-flyer-email-country]');
  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const accessToken = window.sessionStorage.getItem('groceryview:accessToken');
    if (!accessToken) {
      setStatus('Sign in first to save MyFlyer email preferences.');
      return;
    }

    const response = await fetch(form.getAttribute('action') || '/api/settings', {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer ' + accessToken,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        notificationChannels: ['email'],
        notificationPreferences: {
          myFlyerWeeklyEmail: Boolean(checkbox && checkbox.checked),
          myFlyerCountry: country && country.value ? country.value : 'se'
        }
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(body.error || 'Unable to save MyFlyer email preferences.');
      return;
    }
    setStatus(checkbox && checkbox.checked ? 'MyFlyer weekly email is enabled.' : 'MyFlyer weekly email is disabled.');
  });
})();`;

export function generateMetadata() {
  return routeMetadata('/account/email-prefs');
}

export const dynamic = 'force-static';

export default function AccountEmailPreferencesPage() {
  return (
    <PageShell>
      <Eyebrow>Account email preferences</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">MyFlyer weekly email</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Signed-in shoppers can opt in to a weekly HTML email that renders their personalized MyFlyer from source-backed flyer rows. The checkbox writes an explicit account preference before the Monday sender includes the address.
      </p>

      <Card className="mt-6 border-orange-200 bg-orange-50">
        <form action={myFlyerEmailPreference.endpoint} className="grid gap-5" data-my-flyer-email-preferences method="post">
          <input data-my-flyer-email-country name={myFlyerEmailPreference.countryField} type="hidden" value={myFlyerEmailPreference.defaultCountry} />
          <label className="flex items-start gap-3 rounded-lg border border-orange-200 bg-white p-4 shadow-sm">
            <input
              aria-describedby="my-flyer-email-help"
              className="mt-1 h-5 w-5 rounded border-slate-300 text-orange-700"
              data-my-flyer-email-checkbox
              name={myFlyerEmailPreference.field}
              type="checkbox"
              value="true"
            />
            <span>
              <span className="block text-base font-black text-slate-950">Email me my MyFlyer every week</span>
              <span className="mt-1 block text-sm leading-6 text-slate-700" id="my-flyer-email-help">
                Runs {myFlyerEmailPreference.schedule}; only users with this preference set to true and an active email subscription are eligible.
              </span>
            </span>
          </label>

          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-black text-slate-950">Stored in</p>
              <p className="mt-1">{myFlyerEmailPreference.storesIn}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-black text-slate-950">Preference field</p>
              <p className="mt-1">{myFlyerEmailPreference.field}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-black text-slate-950">Cron sender</p>
              <p className="mt-1">{myFlyerEmailPreference.sender}</p>
            </div>
          </div>

          <button className="w-fit rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white" type="submit">
            Save email preference
          </button>
          <p className="text-sm font-semibold text-slate-700" data-my-flyer-email-status>
            No anonymous email preference writes.
          </p>
        </form>
      </Card>
      <script dangerouslySetInnerHTML={{ __html: emailPreferencesScript }} />
    </PageShell>
  );
}
