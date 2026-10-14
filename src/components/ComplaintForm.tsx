import { useState, useEffect } from 'react';
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Complaint | null>(null);

  // Close on ESC if in modal mode
  useEffect(() => {
    if (!isModal || !onSuccessClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSuccessClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onSuccessClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Please provide an issue title.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long.';
    }

    if (!location.trim()) {
      newErrors.location = 'Please specify the exact building, floor, or room.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please describe the problem in detail.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long.';
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Please provide a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const ticket = await onSubmitComplaint({
        title,
        category,
        priority,
        location,
        description,
        submittedBy: submittedBy.trim() || undefined,
        studentId: studentId.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });

      setCreatedTicket(ticket);
    } catch {
      setErrors({ form: 'Failed to record complaint. Please try again.' });
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
    setErrors({});
    setCreatedTicket(null);
  };

  // Success Confirmation View
  if (createdTicket) {
    return (
      <div
        id="ticket-success-screen"
        className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 text-center shadow-lg dark:border-emerald-800/60 dark:bg-slate-900"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Complaint Submitted Successfully!
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your issue has been logged into the CampusFix facility dashboard.
        </p>

        {/* Ticket Reference Card */}
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ticket Number
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
              <strong className="text-slate-700 dark:text-slate-300">Initial Status:</strong>{' '}
              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Pending Review
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            id="btn-submit-another"
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Submit Another Complaint
          </button>
          {onSuccessClose && (
            <button
              id="btn-view-in-dashboard"
              type="button"
              onClick={onSuccessClose}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
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
      className="space-y-6"
      noValidate
    >
      {errors.form && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
          {errors.form}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="form-title"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          Issue Title <span className="text-rose-500">*</span>
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Concise summary of the maintenance or campus defect
        </p>
        <input
          id="form-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Broken water pipe in CS Block 2nd floor restroom"
          className={`mt-2 w-full rounded-xl border bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-3 transition-all dark:bg-slate-800/80 dark:text-slate-100 ${
            errors.title
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 dark:border-slate-700'
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
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
            Category <span className="text-rose-500">*</span>
          </label>
          <div className="relative mt-2">
            <select
              id="form-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 pr-9 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {formCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Priority Selection Pills */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Priority Level <span className="text-rose-500">*</span>
          </label>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[
              { key: 'low', label: 'Low', color: 'border-slate-300 text-slate-700 active:bg-slate-100' },
              { key: 'medium', label: 'Med', color: 'border-yellow-400 text-yellow-800 active:bg-yellow-50' },
              { key: 'high', label: 'High', color: 'border-amber-500 text-amber-800 active:bg-amber-50' },
              { key: 'urgent', label: 'Urgent', color: 'border-rose-500 text-rose-800 active:bg-rose-50' },
            ].map((p) => {
              const isSelected = priority === p.key;
              return (
                <button
                  key={p.key}
                  id={`form-priority-${p.key}`}
                  type="button"
                  onClick={() => setPriority(p.key as ComplaintPriority)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
          Campus Location / Building / Room <span className="text-rose-500">*</span>
        </label>
        <input
          id="form-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Science Block B, 2nd Floor, Room 204"
          className={`mt-2 w-full rounded-xl border bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-3 transition-all dark:bg-slate-800/80 dark:text-slate-100 ${
            errors.location
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 dark:border-slate-700'
          }`}
        />
        {errors.location && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errors.location}
          </p>
        )}

        {/* Quick location chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Quick suggestions:</span>
          {QUICK_LOCATIONS.slice(0, 4).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
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
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-400">
            {description.length} characters
          </span>
        </div>
        <textarea
          id="form-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please explain what is broken, hazards involved, when it started, and any relevant details to help the maintenance crew..."
          className={`mt-2 w-full rounded-xl border bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-3 transition-all dark:bg-slate-800/80 dark:text-slate-100 ${
            errors.description
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 dark:border-slate-700'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errors.description}
          </p>
        )}
      </div>

      {/* Submitter Info Grid */}
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
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="e.g. Bilal Ahmed"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="form-student-id" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Student / Staff ID
            </label>
            <input
              id="form-student-id"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. CS-2023-019"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="form-contact-email" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Campus Email
            </label>
            <input
              id="form-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="name@campus.edu"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
            />
            {errors.contactEmail && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">
                {errors.contactEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onSuccessClose && (
          <button
            id="btn-cancel-form"
            type="button"
            onClick={onSuccessClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
        )}

        <button
          id="btn-submit-complaint"
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 focus:outline-hidden focus:ring-3 focus:ring-blue-300 disabled:opacity-50 transition-all active:scale-95"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Submitting Ticket...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-form-title"
      >
        <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {/* Close X Button */}
          {onSuccessClose && (
            <button
              id="btn-modal-close-x"
              type="button"
              onClick={onSuccessClose}
              className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="mb-6">
            <h2 id="modal-form-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Submit a Campus Facility Issue
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Report equipment defects, infrastructure damage, safety issues, or maintenance needs.
            </p>
          </div>

          {formContent}
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
