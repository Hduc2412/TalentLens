import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '@/locales/en/auth.json'
import enCommon from '@/locales/en/common.json'
import enComparison from '@/locales/en/comparison.json'
import enDomain from '@/locales/en/domain.json'
import enEmployeeProfile from '@/locales/en/employee_profile.json'
import enOrgChart from '@/locales/en/org_chart.json'
import enShell from '@/locales/en/shell.json'
import jaAuth from '@/locales/ja/auth.json'
import jaCommon from '@/locales/ja/common.json'
import jaComparison from '@/locales/ja/comparison.json'
import jaDomain from '@/locales/ja/domain.json'
import jaEmployeeProfile from '@/locales/ja/employee_profile.json'
import jaOrgChart from '@/locales/ja/org_chart.json'
import jaShell from '@/locales/ja/shell.json'

export const DEFAULT_LANGUAGE = 'ja'

export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const resources = {
  ja: {
    common: jaCommon,
    org_chart: jaOrgChart,
    shell: jaShell,
    domain: jaDomain,
    employee_profile: jaEmployeeProfile,
    comparison: jaComparison,
    auth: jaAuth,
  },
  en: {
    common: enCommon,
    org_chart: enOrgChart,
    shell: enShell,
    domain: enDomain,
    employee_profile: enEmployeeProfile,
    comparison: enComparison,
    auth: enAuth,
  },
} as const

void i18next.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: ['common', 'org_chart', 'shell', 'domain', 'employee_profile', 'comparison', 'auth'],
  interpolation: { escapeValue: false },
})

// Keep the document language in sync so screen readers and `:lang()` rules follow.
const syncDocumentLanguage = (language: string): void => {
  if (typeof document !== 'undefined') document.documentElement.lang = language
}

syncDocumentLanguage(i18next.language)
i18next.on('languageChanged', syncDocumentLanguage)

export default i18next
