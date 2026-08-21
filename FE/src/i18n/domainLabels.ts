import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { Department } from '@/types/domain.types'

/**
 * Personnel data arrives from the dataset in Japanese only, so the display layer
 * maps each known source value onto a translation key. Unknown values fall back
 * to the raw string: a new job title must never render as a missing-key label.
 */
const ROLE_KEYS: Record<string, string> = {
  本部長: 'division_head',
  部長: 'department_manager',
  次長: 'deputy_general_manager',
  課長: 'section_manager',
  係長: 'assistant_manager',
  主任: 'chief',
  一般社員: 'staff',
}

const SOCIAL_STYLE_KEYS: Record<string, string> = {
  アナリティカル: 'analytical',
  エクスプレッシブ: 'expressive',
  エミアブル: 'amiable',
  ドライバー: 'driver',
}

const DEPARTMENT_KEYS: Record<string, string> = {
  MusashinoAI事業部: 'musashino_ai',
  kimete事業部: 'kimete',
  HRサポートグループ: 'hr_support',
  ダスキン事業本部: 'duskin',
  'CS・ケア事業部': 'cs_care',
}

/** The four-letter code prefix ("INLA（内向…）") doubles as the translation key. */
const mbtiKey = (value: string): string => value.slice(0, 4)

export interface DomainLabels {
  role: (value: string) => string
  mbti: (value: string) => string
  socialStyle: (value: string) => string
  /** Leaf name of a department, e.g. "HR Support Group". */
  departmentName: (department: Department) => string
  /** Full path of a department, e.g. "Kimete Division HR Support Group". */
  departmentPath: (department: Department) => string
  /** Ancestors only; empty for a root department. */
  departmentParentPath: (department: Department) => string
  /** Competency scale, e.g. "cooperation" -> "協調優先". */
  trait: (key: string) => string
  /** Internal job-model key, e.g. "marketing" -> "マーケティング". */
  job: (key: string) => string
  /** Organisational culture axis, e.g. "structure_rigor" -> "規律・厳格". */
  culture: (key: string) => string
  /** Big Five dimension, e.g. "openness" -> "知的好奇心". */
  bigFive: (key: string) => string
  /** Protected metric, e.g. "psychopathy" -> "サイコパシー". */
  sensitive: (key: string) => string
}

export const useDomainLabels = (): DomainLabels => {
  const { t } = useTranslation('domain')

  return useMemo(() => {
    const lookup = (prefix: string, key: string | undefined, fallback: string): string =>
      key ? t(`${prefix}.${key}`, { defaultValue: fallback }) : fallback

    const segment = (value: string): string => lookup('department', DEPARTMENT_KEYS[value], value)

    return {
      role: (value) => lookup('role', ROLE_KEYS[value], value),
      mbti: (value) => lookup('mbti', mbtiKey(value), value),
      socialStyle: (value) => lookup('social_style', SOCIAL_STYLE_KEYS[value], value),
      departmentName: (department) => segment(department.name),
      departmentPath: (department) => department.path.map(segment).join(' '),
      departmentParentPath: (department) => department.path.slice(0, -1).map(segment).join(' › '),
      trait: (key) => lookup('trait', key, key),
      job: (key) => lookup('job', key, key),
      culture: (key) => lookup('culture', key, key),
      bigFive: (key) => lookup('big_five', key, key),
      sensitive: (key) => lookup('sensitive', key, key),
    }
  }, [t])
}
