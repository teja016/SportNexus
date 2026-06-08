import { Platform } from 'react-native'

export const Colors = {
  primary:         '#1AAFC9',
  primaryDark:     '#1592AA',
  primaryLight:    '#29C5DA',
  accent:          '#10B981',
  navy:            '#0A1628',
  navyMid:         '#1C2E4A',
  danger:          '#EF4444',
  warning:         '#F59E0B',
  success:         '#10B981',
  purple:          '#8B5CF6',
  orange:          '#F97316',
  background:      '#EBF5FB',
  surface:         '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary:     '#0A1628',
  textSecondary:   '#64748B',
  textMuted:       '#94A3B8',
  border:          '#E2E8F0',
  borderLight:     '#F1F5F9',
  tealLight:       '#D0EDF6',
  tealXLight:      '#EBF5FB',
  navyLight:       '#D0EDF6',
  card:            '#FFFFFF',
}

export const Gradients = {
  primary:  ['#1AAFC9', '#1592AA'] as [string, string],
  accent:   ['#10B981', '#059669'] as [string, string],
  navy:     ['#1C2E4A', '#0A1628'] as [string, string],
  warm:     ['#F97316', '#EF4444'] as [string, string],
  purple:   ['#8B5CF6', '#6D28D9'] as [string, string],
  hero:     ['#1AAFC9', '#1C2E4A'] as [string, string],
}

export const SportColors: Record<string, string> = {
  Cricket:    '#10B981',
  Football:   '#3B82F6',
  Basketball: '#F97316',
  Tennis:     '#EAB308',
  Badminton:  '#8B5CF6',
  Swimming:   '#06B6D4',
  Athletics:  '#EF4444',
  Gymnastics: '#EC4899',
  Kabaddi:    '#F59E0B',
  Volleyball: '#6366F1',
}

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
}

export const FontSize = {
  xs:    11,
  sm:    13,
  base:  15,
  lg:    17,
  xl:    20,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
}

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
}

export const BorderRadius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  full: 999,
}

export const Shadow = {
  xs: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1AAFC9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
}
