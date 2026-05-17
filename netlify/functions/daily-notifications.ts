const netlifyGlobal = globalThis as typeof globalThis & {
  Netlify?: {
    env: {
      get(name: string): string | undefined;
    };
  };
};

function env(name: string) {
  return netlifyGlobal.Netlify?.env.get(name) ?? process.env[name];
}

async function dailyNotifications() {
  const siteUrl = env("NEXT_PUBLIC_SITE_URL");
  const cronSecret = env("CRON_SECRET");

  if (!siteUrl || !cronSecret) {
    return new Response("Missing NEXT_PUBLIC_SITE_URL or CRON_SECRET", { status: 500 });
  }

  const response = await fetch(new URL("/api/cron/daily-notifications", siteUrl), {
    headers: {
      authorization: `Bearer ${cronSecret}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    return new Response(body || "Daily notification cron failed", {
      status: response.status,
    });
  }

  return new Response(await response.text(), {
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export default dailyNotifications;

export const config = {
  schedule: "0 6 * * *",
};
