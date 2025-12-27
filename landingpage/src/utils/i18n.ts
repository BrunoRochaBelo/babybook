import ptBR from '../locales/pt-BR.json';
import enUS from '../locales/en-US.json';

type Locale = 'pt-BR' | 'en-US';
type Translations = typeof ptBR;

const RESOURCES: Record<Locale, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

class I18n {
  private currentLocale: Locale = 'pt-BR';

  constructor() {
    this.init();
  }

  private init() {
    // 1. Check URL params
    const params = new URLSearchParams(window.location.search);
    const urlLocale = params.get('lang');

    // 2. Check LocalStorage
    const storedLocale = localStorage.getItem('babybook-locale');

    // 3. Check Browser
    const browserLocale = navigator.language === 'pt-BR' ? 'pt-BR' : 'en-US';

    if (this.isValidLocale(urlLocale)) {
      this.currentLocale = urlLocale;
    } else if (this.isValidLocale(storedLocale)) {
      this.currentLocale = storedLocale;
    } else {
      this.currentLocale = browserLocale;
    }

    // Persist logic
    localStorage.setItem('babybook-locale', this.currentLocale);
    document.documentElement.lang = this.currentLocale;
    
    // Initial translate
    this.updatePage();
  }

  private isValidLocale(locale: string | null): locale is Locale {
    return locale === 'pt-BR' || locale === 'en-US';
  }

  public get locale() {
    return this.currentLocale;
  }

  public setLanguage(locale: Locale) {
    if (this.currentLocale === locale) return;
    
    this.currentLocale = locale;
    localStorage.setItem('babybook-locale', locale);
    document.documentElement.lang = locale;
    this.updatePage();
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale } }));
  }

  public t(key: string): string {
    const keys = key.split('.');
    let value: any = RESOURCES[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        return key; 
      }
    }

    return typeof value === 'string' ? value : key;
  }

  public updatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const translation = this.t(key);
      
      // Check if translation contains HTML (basic check)
      if (translation.includes('<') && translation.includes('>')) {
          el.innerHTML = translation;
      } else {
          // Preserve nested elements if translation is plain text? 
          // No, i18n usually replaces content. 
          // But if we have icons inside buttons, we need to be careful.
          // Strategy: data-i18n-target attribute? 
          // OR: Use specific data-i18n-html for HTML content.
          
          if (el.hasAttribute('data-i18n-html')) {
             el.innerHTML = translation; 
          } else {
             // If element has children and we only want to translate text nodes, it's complex.
             // Simplest: Replace textContent. If structure needed, put structure in translation or wrap text in span.
             // For buttons with icons: wrap text in <span data-i18n="key">Text</span>
             el.textContent = translation;
          }
      }

      // Handle attributes
      const attrs = ['placeholder', 'title', 'alt', 'aria-label'];
      attrs.forEach(attr => {
        const attrKey = el.getAttribute(`data-i18n-${attr}`);
        if(attrKey) {
          el.setAttribute(attr, this.t(attrKey));
        }
      });
    });
  }
}

export const i18n = new I18n();
