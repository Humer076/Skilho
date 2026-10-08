'use client';

import { useState, type FormEvent } from 'react';

export default function AdvertiseEnquiryForm() {
  const [prepared, setPrepared] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const company = String(form.get('company') || '').trim();
    const contact = String(form.get('contact') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const requirement = String(form.get('requirement') || '').trim();
    const message = String(form.get('message') || '').trim();
    const body = [
      `Company name: ${company}`,
      `Contact person: ${contact}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Advertising requirement: ${requirement}`,
      '',
      'Message:',
      message || 'No additional message provided.',
    ].join('\n');

    window.location.href = `mailto:hello@skilho.com?subject=${encodeURIComponent(`Advertising enquiry from ${company}`)}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  }

  return (
    <form className="advertise-enquiry-form" onSubmit={handleSubmit}>
      <h3>Submit an enquiry</h3>
      <p>Fields marked required help us respond to your request.</p>
      <label><span>Company name *</span><input name="company" required autoComplete="organization" placeholder="Your company name" /></label>
      <label><span>Contact person *</span><input name="contact" required autoComplete="name" placeholder="Your name" /></label>
      <label><span>Email *</span><input name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></label>
      <label><span>Phone number *</span><input name="phone" type="tel" required autoComplete="tel" placeholder="Your phone number" /></label>
      <label><span>Advertising requirement *</span><select name="requirement" required defaultValue=""><option value="" disabled>Select what you would like to discuss</option><option>Promote job openings</option><option>Featured job listings</option><option>Hiring campaigns</option><option>Company promotions</option><option>Other / not sure yet</option></select></label>
      <label><span>Message</span><textarea name="message" rows={4} placeholder="Tell us about your hiring or promotion goals (optional)" /></label>
      <button type="submit">Submit Enquiry <span aria-hidden="true">→</span></button>
      <small role="status">{prepared ? 'Your email app should open with the enquiry details ready to send.' : 'Submitting opens your email app with the enquiry details. No payment is required.'}</small>
    </form>
  );
}
