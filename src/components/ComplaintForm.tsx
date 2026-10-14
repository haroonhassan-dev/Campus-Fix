import { useState, useEffect, useCallback } from 'react';
import type { AddComplaintInput, Complaint, ComplaintPriority } from '../types/frontend';
import { CATEGORIES } from '../data/mockComplaints';

interface ComplaintFormProps {
  onSubmitComplaint: (input: AddComplaintInput) => Promise<Complaint>;
  onSuccessClose?: () => void;
  isModal?: boolean;
}

const formCategories = CATEGORIES.filter((cat) => cat !== 'All Categories');

const QUICK_LOCATIONS = [
  'CS Dept - Lab 302',
  'Central Library - 2nd Floor',
  'Hostel Block C - Wing 2',
  'Main Auditorium Hall A',
  'Student Union Hub / Cafeteria',
  'Engineering Complex - LT 12',
  'Science Block Restroom',
  'Campus Sports Complex',
];

// Standard email validation regex accepting common domain structures (.edu.pk, .com, .edu, etc.)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Permissive Student/Staff ID regex supporting hyphens, slashes, and alphanumeric characters (e.g. FA24-BSE-109)
const STUDENT_ID_REGEX = /^[a-zA-Z0-9\-_/ ]{3,30}$/;

export function ComplaintForm({
  onSubmitComplaint,
  onSuccessClose,
  isModal = false,
}: ComplaintFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(formCategories[0]);
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [studentId, setStudentId] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Complaint | null>(null);

  // Close on ESC if in modal mode
  useEffect(() => {
    if (!isModal || !onSuccessClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onSuccessClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onSuccessClose, isSubmitting]);

  // Single field validator
  const validateField = useCallback(
    (fieldName: string, value: string): string | null => {
      const trimmed = value.trim();
      switch (fieldName) {
        case 'title':
          if (!trimmed) return 'Please provide an issue title.';
          if (trimmed.length < 5) return 'Title must be at least 5 characters long.';
          if (trimmed.length > 100) return 'Title must not exceed 100 characters.';
          return null;
        case 'location':
          if (!trimmed) return 'Please specify the exact building, floor, or room.';
          if (trimmed.length < 3) return 'Location must be at least 3 characters.';
          if (trimmed.length > 100) return 'Location must not exceed 100 characters.';
          return null;
        case 'description':
          if (!trimmed) return 'Please describe the problem in detail.';
          if (trimmed.length < 10) return 'Description must be at least 10 characters long.';
          if (trimmed.length > 1000) return 'Description must not exceed 1000 characters.';
          return null;
        case 'contactEmail':
          if (trimmed && !EMAIL_REGEX.test(trimmed)) {
            return 'Please enter a valid email address (e.g. student@campus.edu.pk or name@gmail.com).';
          }
          return null;
        case 'studentId':
          if (trimmed && !STUDENT_ID_REGEX.test(trimmed)) {
            return 'Student / Staff ID may contain letters, numbers, and hyphens (e.g. FA24-BSE-109).';
          }
          return null;
        default:
          return null;
      }
    },
    []
  );

  // Validate entire form on submission
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleErr = validateField('title', title);
    if (titleErr) newErrors.title = titleErr;

    const locErr = validateField('location', location);
    if (locErr) newErrors.location = locErr;

    const descErr = validateField('description', description);
    if (descErr) newErrors.description = descErr;

    const emailErr = validateField('contactEmail', contactEmail);
    if (emailErr) newErrors.contactEmail = emailErr;

    const studentErr = validateField('studentId', studentId);
    if (studentErr) newErrors.studentId = studentErr;

    setErrors(newErrors);
    setTouched({
      title: true,
      location: true,
      description: true,
      contactEmail: true,
      studentId: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const err = validateField(fieldName, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[fieldName] = err;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  };

  const handleChange = (fieldName: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (submitError) setSubmitError(null);
    if (touched[fieldName]) {
      const err = validateField(fieldName, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) {
          next[fieldName] = err;
        } else {
          delete next[fieldName];
        }
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await onSubmitComplaint({
        title: title.trim(),
        category,
        priority,
        location: location.trim(),
        description: description.trim(),
        submittedBy: submittedBy.trim() || undefined,
        studentId: studentId.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });

      setCreatedTicket(ticket);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit complaint. Please check your connection and try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setCategory(formCategories[0]);
    setPriority('medium');
    setLocation('');
    setDescription('');
    setSubmittedBy('');
    setStudentId('');
    setContactEmail('');
    setTouched({});
    setErrors({});
    setSubmitError(null);
    setCreatedTicket(null);
  };

  // Success Confirmation Screen
  if (createdTicket) {
    return (
      <div
        id="ticket-success-screen"
        role="region"
        aria-label="Submission confirmation"
        className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 text-center shadow-lg dark:border-emerald-800/60 dark:bg-slate-900"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Complaint Submitted Successfully!
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your issue has been recorded and queued for the Campus Facilities maintenance team.
        </p>

        {/* Ticket Reference Summary */}
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Ticket ID
            </span>
            <span className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400">
              {createdTicket.id}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <p>
              <strong className="text-slate-700 dark:text-slate-300">Title:</strong>{' '}
              <span className="text-slate-900 dark:text-slate-100 font-medium">{createdTicket.title}</span>
            </p>
            <p>
              <strong className="text-slate-700 dark:text-slate-300">Location:</strong>{' '}
              <span className="text-slate-600 dark:text-slate-400">{createdTicket.location}</span>
            </p>
            <p>
              <strong className="text-slate-700 dark:text-slate-300">Category:</strong>{' '}
              <span className="text-slate-600 dark:text-slate-400">{createdTicket.category}</span>
            </p>
            <p>
              <strong className="text-slate-700 dark:text-slate-300">Priority:</strong>{' '}
              <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                {createdTicket.priority}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            id="btn-submit-another"
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 min-h-[44px]"
          >
            Submit Another Complaint
          </button>
          {onSuccessClose && (
            <button
              id="btn-view-in-dashboard"
              type="button"
              onClick={onSuccessClose}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 min-h-[44px]"
            >
              View in Complaints List
            </button>
          )}
        </div>
      </div>
    );
  }

  const formContent = (
    <form
      id="complaint-submission-form"
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
      aria-busy={isSubmitting}
    >
      {/* Submission Error Banner */}
      {submitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <svg className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-bold">Submission Error</p>
            <p className="mt-0.5">{submitError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-1 rounded"
            aria-label="Dismiss error notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fieldset to disable all fields during submission */}
      <fieldset disabled={isSubmitting} className="space-y-5 disabled:opacity-75">
        {/* Title */}
        <div>
          <label
            htmlFor="form-title"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            Issue Title <span className="text-rose-500" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <p id="form-title-hint" className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Concise summary of the defect (5–100 characters)
          </p>
          <input
            id="form-title"
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => handleChange('title', e.target.value, setTitle)}
            onBlur={() => handleBlur('title', title)}
            placeholder="e.g. Broken water pipe in CS Block 2nd floor restroom"
            aria-invalid={Boolean(errors.title && touched.title)}
            aria-describedby={`form-title-hint ${errors.title && touched.title ? 'form-title-error' : ''}`.trim()}
            className={`mt-2 w-full rounded-xl border bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all dark:bg-slate-800/80 dark:text-slate-100 min-h-[44px] ${
              errors.title && touched.title
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700'
            }`}
          />
          {errors.title && touched.title && (
            <p id="form-title-error" role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errors.title}
            </p>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label
              htmlFor="form-category"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Category <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <div className="relative mt-2">
              <select
                id="form-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 pr-9 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 min-h-[44px]"
              >
                {formCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Priority Selection Pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Priority Level <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Select priority level">
              {[
                { key: 'low', label: 'Low' },
                { key: 'medium', label: 'Med' },
                { key: 'high', label: 'High' },
                { key: 'urgent', label: 'Urgent' },
              ].map((p) => {
                const isSelected = priority === p.key;
                return (
                  <button
                    key={p.key}
                    id={`form-priority-${p.key}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPriority(p.key as ComplaintPriority)}
                    className={`rounded-xl border py-2.5 px-2 text-xs font-bold transition-all text-center min-h-[44px] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="form-location"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            Campus Location / Building / Room <span className="text-rose-500" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="form-location"
            type="text"
            required
            maxLength={100}
            value={location}
            onChange={(e) => handleChange('location', e.target.value, setLocation)}
            onBlur={() => handleBlur('location', location)}
            placeholder="e.g. Science Block B, 2nd Floor, Room 204"
            aria-invalid={Boolean(errors.location && touched.location)}
            aria-describedby={errors.location && touched.location ? 'form-location-error' : undefined}
            className={`mt-2 w-full rounded-xl border bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all dark:bg-slate-800/80 dark:text-slate-100 min-h-[44px] ${
              errors.location && touched.location
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700'
            }`}
          />
          {errors.location && touched.location && (
            <p id="form-location-error" role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errors.location}
            </p>
          )}

          {/* Quick location suggestion chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Common campus location suggestions">
            <span className="text-[11px] font-semibold text-slate-400">Quick suggestions:</span>
            {QUICK_LOCATIONS.slice(0, 4).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setLocation(loc);
                  handleBlur('location', loc);
                }}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-slate-800 dark:text-slate-300 min-h-[32px] transition-colors"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="form-description"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Detailed Description <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <span
              id="form-desc-counter"
              className={`text-xs ${
                description.length > 950
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {description.length} / 1000 characters
            </span>
          </div>
          <textarea
            id="form-description"
            required
            rows={4}
            maxLength={1000}
            value={description}
            onChange={(e) => handleChange('description', e.target.value, setDescription)}
            onBlur={() => handleBlur('description', description)}
            placeholder="Please explain what is broken, hazards involved, and any details to assist maintenance staff..."
            aria-invalid={Boolean(errors.description && touched.description)}
            aria-describedby={`form-desc-counter ${
              errors.description && touched.description ? 'form-description-error' : ''
            }`.trim()}
            className={`mt-2 w-full rounded-xl border bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all dark:bg-slate-800/80 dark:text-slate-100 ${
              errors.description && touched.description
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-600'
                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700'
            }`}
          />
          {errors.description && touched.description && (
            <p id="form-description-error" role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errors.description}
            </p>
          )}
        </div>

        {/* Submitter Info Grid (Optional) */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Submitter Information (Optional)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="form-submitter-name" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Full Name
              </label>
              <input
                id="form-submitter-name"
                type="text"
                maxLength={80}
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="e.g. Bilal Ahmed"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 min-h-[40px]"
              />
            </div>

            <div>
              <label htmlFor="form-student-id" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Student / Staff ID
              </label>
              <input
                id="form-student-id"
                type="text"
                maxLength={30}
                value={studentId}
                onChange={(e) => handleChange('studentId', e.target.value, setStudentId)}
                onBlur={() => handleBlur('studentId', studentId)}
                placeholder="e.g. FA24-BSE-109"
                aria-invalid={Boolean(errors.studentId && touched.studentId)}
                aria-describedby={errors.studentId && touched.studentId ? 'form-student-id-error' : undefined}
                className={`mt-1 w-full rounded-xl border bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 min-h-[40px] ${
                  errors.studentId && touched.studentId ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.studentId && touched.studentId && (
                <p id="form-student-id-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-medium">
                  {errors.studentId}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="form-contact-email" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Campus or Personal Email
              </label>
              <input
                id="form-contact-email"
                type="email"
                maxLength={100}
                value={contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value, setContactEmail)}
                onBlur={() => handleBlur('contactEmail', contactEmail)}
                placeholder="name@campus.edu.pk or gmail.com"
                aria-invalid={Boolean(errors.contactEmail && touched.contactEmail)}
                aria-describedby={errors.contactEmail && touched.contactEmail ? 'form-contact-email-error' : undefined}
                className={`mt-1 w-full rounded-xl border bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 min-h-[40px] ${
                  errors.contactEmail && touched.contactEmail ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.contactEmail && touched.contactEmail && (
                <p id="form-contact-email-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-medium">
                  {errors.contactEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        {onSuccessClose && (
          <button
            id="btn-cancel-form"
            type="button"
            disabled={isSubmitting}
            onClick={onSuccessClose}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 min-h-[44px]"
          >
            Cancel
          </button>
        )}

        <button
          id="btn-submit-complaint"
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 transition-all min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span aria-live="polite">Submitting Ticket...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Submit Complaint</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  // If used inside a modal popup
  if (isModal) {
    return (
      <div
        id="modal-complaint-submission"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-form-title"
      >
        <div className="relative my-auto w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <h2 id="modal-form-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Submit a Campus Facility Issue
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Report equipment defects, infrastructure damage, safety issues, or maintenance needs.
              </p>
            </div>

            {onSuccessClose && (
              <button
                id="btn-modal-close-x"
                type="button"
                disabled={isSubmitting}
                onClick={onSuccessClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close dialog"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Scrollable form body */}
          <div className="overflow-y-auto pt-4 pr-1">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  // Standalone card view (e.g. for dedicated tab)
  return (
    <div
      id="complaint-form-container"
      className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Submit New Complaint
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Please provide complete details so campus facilities and technicians can dispatch quickly.
        </p>
      </div>

      {formContent}
    </div>
  );
}

export default ComplaintForm;
