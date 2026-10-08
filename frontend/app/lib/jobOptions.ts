export type Option = { value: string; label: string };

export const CATEGORY_OPTIONS = [
  'Mobile Technician',
  'Laptop Technician',
  'Chip-Level Engineer',
  'Trainee / Apprentice',
  'Team Lead / Supervisor',
  'Other',
];

export const SPECIALIZATIONS = [
  'Android',
  'iPhone',
  'Android & iPhone',
  'Laptop Hardware',
  'Laptop Software',
  'Chip-Level Repair',
  'Motherboard Repair',
  'IC-Level Repair',
  'Microsoldering',
  'BIOS Programming',
  'MacBook Repair',
  'Other skills',
];

export const EXPERIENCE_OPTIONS: Option[] = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'Y0_1', label: '0-1 years' },
  { value: 'Y1_3', label: '1-3 years' },
  { value: 'Y3_5', label: '3-5 years' },
  { value: 'Y5_10', label: '5-10 years' },
  { value: 'Y10_PLUS', label: '10+ years' },
];

export const JOINING_OPTIONS: Option[] = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'WITHIN_7_DAYS', label: 'Within 7 days' },
  { value: 'WITHIN_15_DAYS', label: 'Within 15 days' },
  { value: 'WITHIN_30_DAYS', label: 'Within 30 days' },
  { value: 'NOTICE_PERIOD_FLEXIBLE', label: 'Notice period accepted / flexible' },
];

export const WORK_TYPE_OPTIONS: Option[] = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

export function labelOf(options: Option[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}