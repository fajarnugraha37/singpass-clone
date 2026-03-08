export type Locale = 'en' | 'zh' | 'ms' | 'ta';

export interface LayoutProps {
  title: string;
  description?: string;
  lang?: Locale;
}

export interface NavItem {
  label: string;
  href: string;
}
