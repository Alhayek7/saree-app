// =====================================================
// ألوان تطبيق سريع - Saree3
// =====================================================

export const Colors = {
  // =====================================================
  // الألوان الأساسية (Primary)
  // =====================================================
  primary: '#6C63FF',        // البنفسجي الأساسي
  primaryLight: '#8B85FF',   // بنفسجي فاتح
  primaryDark: '#4B44CC',    // بنفسجي داكن
  primarySoft: '#F0EFFF',    // خلفية بنفسجية خفيفة

  // =====================================================
  // ألوان الأدوار (Role Colors)
  // =====================================================
  customer: '#6C63FF',       // العميل - بنفسجي
  driver: '#28A745',         // السائق - أخضر
  agent: '#FF8C00',          // الوكيل - برتقالي
  admin: '#DC3545',          // الأدمن - أحمر

  // =====================================================
  // ألوان الحالات (Status Colors)
  // =====================================================
  pending: '#FFC107',        // انتظار - أصفر
  bidding: '#17A2B8',        // مزايدة - سماوي
  assigned: '#6C63FF',       // معين - بنفسجي
  pickedUp: '#FF8C00',       // تم الاستلام - برتقالي
  delivered: '#28A745',      // تم التوصيل - أخضر
  cancelled: '#DC3545',      // ملغي - أحمر

  // =====================================================
  // ألوان النجاح والخطأ والتحذير
  // =====================================================
  success: '#28A745',
  successLight: '#D4EDDA',
  successDark: '#1E7E34',

  error: '#DC3545',
  errorLight: '#F8D7DA',
  errorDark: '#BD2130',

  warning: '#FFC107',
  warningLight: '#FFF3CD',
  warningDark: '#D39E00',

  info: '#17A2B8',
  infoLight: '#D1ECF1',
  infoDark: '#117A8B',

  // =====================================================
  // الألوان المحايدة (Neutrals)
  // =====================================================
  white: '#FFFFFF',
  black: '#000000',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // =====================================================
  // الوضع الفاتح (Light Mode)
  // =====================================================
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F4F6',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    placeholder: '#D1D5DB',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    header: '#FFFFFF',
    card: '#FFFFFF',
    input: '#F9FAFB',
    inputBorder: '#E5E7EB',
    inputFocused: '#6C63FF',
    divider: '#E5E7EB',
  },

  // =====================================================
  // الوضع الداكن (Dark Mode)
  // =====================================================
  dark: {
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceSecondary: '#16213E',
    border: '#2D2D44',
    borderLight: '#252538',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    placeholder: '#4B5563',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#1A1A2E',
    tabBarBorder: '#2D2D44',
    header: '#1A1A2E',
    card: '#1A1A2E',
    input: '#16213E',
    inputBorder: '#2D2D44',
    inputFocused: '#8B85FF',
    divider: '#2D2D44',
  },

  // =====================================================
  // تدرجات الألوان (Gradients)
  // =====================================================
  gradients: {
    primary: ['#6C63FF', '#4B44CC'],
    success: ['#28A745', '#1E7E34'],
    warning: ['#FFC107', '#D39E00'],
    error: ['#DC3545', '#BD2130'],
    dark: ['#1A1A2E', '#0F0F1A'],
    card: ['#FFFFFF', '#F9FAFB'],
  },

  // =====================================================
  // ألوان شفافة (Transparent)
  // =====================================================
  transparent: 'transparent',
  primaryTransparent10: 'rgba(108, 99, 255, 0.1)',
  primaryTransparent20: 'rgba(108, 99, 255, 0.2)',
  primaryTransparent50: 'rgba(108, 99, 255, 0.5)',
  successTransparent10: 'rgba(40, 167, 69, 0.1)',
  errorTransparent10: 'rgba(220, 53, 69, 0.1)',
  warningTransparent10: 'rgba(255, 193, 7, 0.1)',
};

// =====================================================
// Hook لاستخدام الألوان حسب الثيم
// =====================================================

export type ColorScheme = 'light' | 'dark';

export const getColors = (scheme: ColorScheme = 'light') => ({
  ...Colors,
  theme: scheme === 'dark' ? Colors.dark : Colors.light,
});

// =====================================================
// ألوان حالة الطلب مع النص
// =====================================================

export const getStatusColor = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: Colors.warningLight,  text: Colors.warningDark,  label: 'قيد الانتظار' },
    bidding:   { bg: Colors.infoLight,     text: Colors.infoDark,     label: 'جارٍ المزايدة' },
    assigned:  { bg: Colors.primarySoft,   text: Colors.primaryDark,  label: 'تم التعيين' },
    picked_up: { bg: '#FFF3E0',            text: '#E65100',           label: 'تم الاستلام' },
    delivered: { bg: Colors.successLight,  text: Colors.successDark,  label: 'تم التوصيل' },
    cancelled: { bg: Colors.errorLight,    text: Colors.errorDark,    label: 'ملغي' },
  };
  return map[status] ?? { bg: Colors.gray100, text: Colors.gray600, label: status };
};

export default Colors;