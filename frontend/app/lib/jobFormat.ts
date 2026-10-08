export function salaryText(
  min: number | null,
  max: number | null,
  negotiable: boolean,
) {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  let text = 'Salary not specified';
  if (min != null && max != null) {
    text = `Rs. ${fmt(min)} - ${fmt(max)} / month`;
  } else if (min != null) {
    text = `From Rs. ${fmt(min)} / month`;
  } else if (max != null) {
    text = `Up to Rs. ${fmt(max)} / month`;
  }
  return negotiable ? `${text} (negotiable)` : text;
}

export function postedText(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted on ${date.toLocaleDateString()}`;
}