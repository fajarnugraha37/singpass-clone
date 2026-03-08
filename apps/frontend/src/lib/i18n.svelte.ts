export type Locale = 'en' | 'zh' | 'ms' | 'ta';

export const translations = {
  en: {
    'login.header': 'Log in with Singpass',
    'login.tab.app': 'Singpass App',
    'login.tab.password': 'Password Login',
    'login.form.id.label': 'Singpass ID',
    'login.form.id.placeholder': 'e.g. S1234567A',
    'login.form.password.label': 'Password',
    'login.form.submit': 'Log in',
    'login.form.error.nric': 'Please enter a valid Singpass ID',
    'login.footer.copyright': '© 2026 Government of Singapore',
    'login.footer.links.privacy': 'Privacy Statement',
    'login.footer.links.terms': 'Terms of Use',
  },
  zh: {
    'login.header': '使用 Singpass 登录',
    'login.tab.app': 'Singpass 应用',
    'login.tab.password': '密码登录',
    'login.form.id.label': 'Singpass ID',
    'login.form.id.placeholder': '例如 S1234567A',
    'login.form.password.label': '密码',
    'login.form.submit': '登录',
    'login.form.error.nric': '请输入有效的 Singpass ID',
    'login.footer.copyright': '© 2026 新加坡政府',
    'login.footer.links.privacy': '隐私声明',
    'login.footer.links.terms': '使用条款',
  },
  ms: {
    'login.header': 'Log masuk dengan Singpass',
    'login.tab.app': 'Aplikasi Singpass',
    'login.tab.password': 'Log Masuk Kata Laluan',
    'login.form.id.label': 'ID Singpass',
    'login.form.id.placeholder': 'cth. S1234567A',
    'login.form.password.label': 'Kata Laluan',
    'login.form.submit': 'Log masuk',
    'login.form.error.nric': 'Sila masukkan ID Singpass yang sah',
    'login.footer.copyright': '© 2026 Kerajaan Singapura',
    'login.footer.links.privacy': 'Kenyataan Privasi',
    'login.footer.links.terms': 'Syarat Penggunaan',
  },
  ta: {
    'login.header': 'Singpass மூலம் உள்நுழையவும்',
    'login.tab.app': 'Singpass செயலி',
    'login.tab.password': 'கடவுச்சொல் உள்நுழைவு',
    'login.form.id.label': 'Singpass ID',
    'login.form.id.placeholder': 'உதாரணம் S1234567A',
    'login.form.password.label': 'கடவுச்சொல்',
    'login.form.submit': 'உள்நுழைக',
    'login.form.error.nric': 'செல்லுபடியாகும் Singpass ID-ஐ உள்ளிடவும்',
    'login.footer.copyright': '© 2026 சிங்கப்பூர் அரசு',
    'login.footer.links.privacy': 'தனியுரிமை அறிக்கை',
    'login.footer.links.terms': 'பயன்பாட்டு விதிமுறைகள்',
  },
};

class I18nStore {
  locale = $state<Locale>('en');

  t(key: keyof typeof translations.en) {
    return translations[this.locale][key] || key;
  }

  setLocale(newLocale: Locale) {
    this.locale = newLocale;
  }
}

export const i18n = new I18nStore();
