import { ReactNode, useEffect, useRef } from 'react';

export const getAdminTheme = (theme: string) => ({
  pageTitle: theme === 'dark' ? 'text-[#F2F2F2]' : 'text-slate-900',
  mutedText: theme === 'dark' ? 'text-slate-400' : 'text-slate-500',
  card: theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-slate-200',
  tableHeader: theme === 'dark' ? 'bg-[#171717] border-[#333333] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600',
  tableRow: theme === 'dark' ? 'border-[#333333] hover:bg-[#262626]' : 'border-slate-200 hover:bg-slate-50',
  input: theme === 'dark'
    ? 'bg-[#171717] border-[#333333] text-white placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400',
  panel: theme === 'dark' ? 'bg-[#171717] border-[#333333]' : 'bg-slate-50 border-slate-200',
});

type PanelProps = {
  theme: string;
  children: ReactNode;
  className?: string;
};

export function AdminPanel({ theme, children, className = '' }: PanelProps) {
  const styles = getAdminTheme(theme);
  return <div className={`${styles.card} rounded-2xl border shadow-sm ${className}`}>{children}</div>;
}

type PageIntroProps = {
  theme: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageIntro({ theme, title, description, actions }: PageIntroProps) {
  const styles = getAdminTheme(theme);
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className={`text-2xl font-semibold ${styles.pageTitle}`}>{title}</h2>
        <p className={`mt-1 text-sm ${styles.mutedText}`}>{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

type StatusBadgeProps = {
  label: string;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
};

const tones: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  blue: 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#57cf85]',
  green: 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#57cf85]',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StatusBadge({ label, tone = 'slate' }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>;
}

type ApiStatusBannerProps = {
  title?: string;
  message: string;
  tone?: 'amber' | 'red' | 'blue' | 'green';
  className?: string;
};

const bannerTones: Record<NonNullable<ApiStatusBannerProps['tone']>, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  red: 'border-red-200 bg-red-50 text-red-900',
  blue: 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#2f8d56]',
  green: 'border-[#57cf85]/20 bg-[#57cf85]/12 text-[#2f8d56]',
};

export function ApiStatusBanner({
  title = 'Live data issue',
  message,
  tone = 'amber',
  className = '',
}: ApiStatusBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${bannerTones[tone]} ${className}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
};

export function useLiveRefresh(callback: () => void | Promise<void>, delay = 15000, deps: any[] = []) {
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      if (!isActive || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        inFlightRef.current = false;
      }
    };

    run();
    const intervalId = window.setInterval(() => {
      run();
    }, delay);
    const handleFocus = () => {
      run();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [delay, ...deps]);
}
