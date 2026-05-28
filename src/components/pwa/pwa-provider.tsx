"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bell, Download, RefreshCw, WifiOff, X } from "lucide-react";
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/features/push/actions";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone))
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function PWAProvider({ signedIn }: { signedIn: boolean }) {
  const deferredInstall = useRef<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [hidden, setHidden] = useState(false);
  const [isPending, startTransition] = useTransition();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const canPromptPush = useMemo(() => {
    if (!signedIn || !ready || !pushAvailable || !vapidPublicKey || pushEnabled) {
      return false;
    }

    return Notification.permission === "default";
  }, [pushAvailable, pushEnabled, ready, signedIn, vapidPublicKey]);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      setReady(true);
      setOnline(navigator.onLine);
    }, 0);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredInstall.current = event as BeforeInstallPromptEvent;
      if (!localStorage.getItem("shg:pwa-install-dismissed") && !isStandalone()) {
        setInstallAvailable(true);
      }
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(async (registration) => {
          if (registration.waiting) {
            setUpdateAvailable(true);
          }

          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) {
              return;
            }

            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });

          if ("PushManager" in window && "Notification" in window && vapidPublicKey) {
            setPushAvailable(true);
            const subscription = await registration.pushManager.getSubscription();
            setPushEnabled(Boolean(subscription));
          }
        })
        .catch(() => {
          setMessage("Uygulama modu bu tarayıcıda başlatılamadı.");
        });
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, [vapidPublicKey]);

  async function installApp() {
    const prompt = deferredInstall.current;
    if (!prompt) {
      return;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredInstall.current = null;
    setInstallAvailable(false);

    if (choice.outcome === "dismissed") {
      localStorage.setItem("shg:pwa-install-dismissed", "1");
    }
  }

  function dismissInstall() {
    localStorage.setItem("shg:pwa-install-dismissed", "1");
    setInstallAvailable(false);
  }

  function applyUpdate() {
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
  }

  async function enablePush() {
    if (!vapidPublicKey || !("serviceWorker" in navigator) || !("Notification" in window)) {
      setMessage("Bildirimler bu tarayıcıda desteklenmiyor.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Bildirim izni verilmedi.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    startTransition(async () => {
      const result = await savePushSubscriptionAction(JSON.parse(JSON.stringify(subscription)));
      setMessage(result.message);
      setPushEnabled(result.ok);
    });
  }

  async function disablePush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    await subscription?.unsubscribe();

    startTransition(async () => {
      const result = await removePushSubscriptionAction(subscription?.endpoint);
      setMessage(result.message);
      setPushEnabled(false);
    });
  }

  if (!ready || hidden || (!updateAvailable && online && !installAvailable && !canPromptPush && !message)) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-[80] mx-auto max-w-xl sm:bottom-5">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)] shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
            {!online ? <WifiOff className="size-5" /> : updateAvailable ? <RefreshCw className="size-5" /> : installAvailable ? <Download className="size-5" /> : <Bell className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            {!online ? (
              <>
                <div className="font-black">Çevrimdışısın.</div>
                <p className="mt-0.5 text-[var(--muted)]">Bağlantı gelene kadar kaydedilmiş sayfalar açılır.</p>
              </>
            ) : updateAvailable ? (
              <>
                <div className="font-black">Yeni sürüm hazır.</div>
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="mt-2 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-black text-slate-950"
                >
                  Yenile
                </button>
              </>
            ) : installAvailable ? (
              <>
                <div className="font-black">ŞHG Sosyal&apos;i uygulama gibi kullan.</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={installApp}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-black text-slate-950"
                  >
                    Kur
                  </button>
                  <button
                    type="button"
                    onClick={dismissInstall}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-black text-[var(--muted)]"
                  >
                    Sonra
                  </button>
                </div>
              </>
            ) : canPromptPush ? (
              <>
                <div className="font-black">Anlık bildirimleri aç.</div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={enablePush}
                  className="mt-2 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"
                >
                  {isPending ? "Açılıyor..." : "Bildirimleri aç"}
                </button>
              </>
            ) : (
              <p className="font-semibold">{message}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            {pushEnabled ? (
              <button
                type="button"
                onClick={disablePush}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]"
              >
                Kapat
              </button>
            ) : null}
            <button
              type="button"
              aria-label="PWA mesajını kapat"
              onClick={() => setHidden(true)}
              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
