import { i18n } from "../utils/i18n";

export function setupLanguageSelector() {
  const container = document.getElementById("lang-selector-container");
  if (!container) return;

  const currentLang = i18n.locale;

  // Render minimal selector
  container.innerHTML = `
    <div class="relative group">
      <select 
        id="lang-select" 
        class="appearance-none bg-transparent pl-2 pr-6 py-1 text-sm font-medium text-gray-600 hover:text-orange-600 focus:outline-none cursor-pointer border-none ring-0 w-auto"
        aria-label="Select Language"
      >
        <option value="pt-BR" ${currentLang === 'pt-BR' ? 'selected' : ''}>🇧🇷 PT</option>
        <option value="en-US" ${currentLang === 'en-US' ? 'selected' : ''}>🇺🇸 EN</option>
      </select>
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
         <svg class="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  `;

  const select = document.getElementById("lang-select") as HTMLSelectElement;
  
  // Handle change
  select.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    i18n.setLanguage(target.value as any);
  });

  // Listen to external changes (if any)
  window.addEventListener("languageChanged", ((e: CustomEvent) => {
    if (select.value !== e.detail.locale) {
      select.value = e.detail.locale;
    }
  }) as EventListener);

  return () => {
    // cleanup if needed
  };
}
