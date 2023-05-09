type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value: number;
};

export const setOrgName = (org: string) => {
  window.gtag('set', {
    org: org
  });
};

export const setUserId = (user_id: string) => {
  window.gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
    user_id: user_id
  });
};

export const pageview = (url: URL) => {
  window.gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
    page_path: url
  });
};

export const event = ({ action, category, label, value }: GTagEvent) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
};
