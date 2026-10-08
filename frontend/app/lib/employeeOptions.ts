export type Option = { value: string; label: string };

export const EMPLOYMENT_OPTIONS: Option[] = [
  { value: 'EMPLOYED', label: 'Currently employed' },
  { value: 'UNEMPLOYED', label: 'Looking for work' },
  { value: 'STUDENT', label: 'Student / in training' },
  { value: 'FREELANCER', label: 'Freelancer / self-employed' },
];

export const SKILL_LEVEL_OPTIONS: Option[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

export const STAGE_OPTIONS: Option[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'JUNIOR_TECHNICIAN', label: 'Junior Technician' },
  { value: 'EXPERIENCED_TECHNICIAN', label: 'Experienced Technician' },
];

export const CAREER_EMPLOYMENT_OPTIONS: Option[] = [
  { value: 'TRAINING', label: 'Training / course' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'APPRENTICESHIP', label: 'Apprenticeship' },
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
];

export function labelOf(options: Option[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}