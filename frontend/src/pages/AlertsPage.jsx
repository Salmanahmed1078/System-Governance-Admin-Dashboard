import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AlertsClient from './AlertsClient';

export default function G09_AlertsPage() {
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    document.title = 'G09_AlertsPage — M9';
  }, []);

  useEffect(() => {
    let alive = true;
    setPayload(null);
    api.alerts().then((data) => {
      if (alive) setPayload(data || {});
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!payload) {
    return <p className="text-sm text-on-surface-variant italic py-12 text-center">Loading…</p>;
  }

  const summary = payload.summary || { critical: 0, warning: 0, info: 0, resolved: 0 };
  const feed = payload.feed || [];
  const rules = payload.rules || [];

  return (
    <div>
      <AlertsClient initialFeed={feed} initialSummary={summary} rules={rules} />
    </div>
  );
}
