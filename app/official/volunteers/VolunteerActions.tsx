"use client";

import { useState, useTransition } from "react";
import {
  setPosition,
  setTenureYear,
  setVolunteerStatus,
  addHourAdjustment,
  deleteVolunteerPermanently,
  setProfilePhoto,
  updateVolunteerInfo,
} from "./actions";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import type { EligibilityResult } from "@/lib/hoursEligibility";
import PortraitCropper from "@/components/PortraitCropper";
import {
  GraduationCap,
  UserX,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Tent,
  PlusCircle,
  Trash2,
  Camera,
  Pencil,
  X,
} from "lucide-react";

type BlockedAction =
  | {
      kind: "promote";
      targetYear: number;
      nssYear: 1 | 2;
      eligibility: EligibilityResult;
    }
  | {
      kind: "graduate";
      nssYear: 1 | 2;
      eligibility: EligibilityResult;
    };

export default function VolunteerActions({
  userId,
  fullName,
  department,
  phone,
  rollNumber,
  year,
  currentPosition,
  tenureYear,
  status,
  positions,
}: {
  userId: string;
  fullName: string;
  department: string | null;
  phone: string | null;
  rollNumber: string | null;
  year: number | null;
  currentPosition: string | null;
  tenureYear: number;
  status: "active" | "graduated" | "removed";
  positions: string[];
}) {
  const [pending, startTransition] = useTransition();

  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const [confirmModal, setConfirmModal] = useState<
    "graduate" | "remove" | null
  >(null);

  const [blocked, setBlocked] = useState<BlockedAction | null>(null);

  const [adjCategory, setAdjCategory] = useState(EVENT_CATEGORIES[0]);
  const [adjHours, setAdjHours] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjError, setAdjError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [photoOpen, setPhotoOpen] = useState(false);
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Edit Info — official can change any field, anytime
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(fullName);
  const [editDepartment, setEditDepartment] = useState(department ?? "");
  const [editPhone, setEditPhone] = useState(phone ?? "");
  const [editRollNumber, setEditRollNumber] = useState(rollNumber ?? "");
  const [editYear, setEditYear] = useState(year ? String(year) : "");
  const [editError, setEditError] = useState<string | null>(null);

  function handlePositionChange(val: string) {
    if (val === "__custom__") {
      setCustomOpen(true);
      return;
    }

    startTransition(async () => {
      await setPosition(userId, val || null);
    });
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!customValue.trim()) return;

    startTransition(async () => {
      await setPosition(userId, customValue.trim());
      setCustomOpen(false);
      setCustomValue("");
    });
  }

  function handleTenureChange(yr: number) {
    startTransition(async () => {
      const result = await setTenureYear(userId, yr);

      if (!result.success && result.eligibility) {
        setBlocked({
          kind: "promote",
          targetYear: yr,
          nssYear: 1,
          eligibility: result.eligibility,
        });
      }
    });
  }

  function handleStatusUpdate(
    newStatus: "active" | "graduated" | "removed"
  ) {
    startTransition(async () => {
      const result = await setVolunteerStatus(userId, newStatus);

      if (!result.success && result.eligibility) {
        setConfirmModal(null);

        setBlocked({
          kind: "graduate",
          nssYear: 2,
          eligibility: result.eligibility,
        });

        return;
      }

      setConfirmModal(null);
    });
  }

  function handleAddAdjustment() {
    if (!blocked) return;

    setAdjError(null);

    const hoursNum = parseFloat(adjHours);

    if (!hoursNum || hoursNum <= 0) {
      setAdjError("Enter a positive number of hours.");
      return;
    }

    startTransition(async () => {
      try {
        await addHourAdjustment(
          userId,
          blocked.nssYear,
          adjCategory,
          hoursNum,
          adjReason
        );

        setAdjHours("");
        setAdjReason("");

        if (blocked.kind === "promote") {
          const result = await setTenureYear(
            userId,
            blocked.targetYear
          );

          if (result.success) {
            setBlocked(null);
          } else if (result.eligibility) {
            setBlocked({
              ...blocked,
              eligibility: result.eligibility,
            });
          }
        } else {
          const result = await setVolunteerStatus(
            userId,
            "graduated"
          );

          if (result.success) {
            setBlocked(null);
          } else if (result.eligibility) {
            setBlocked({
              ...blocked,
              eligibility: result.eligibility,
            });
          }
        }
      } catch (e: any) {
        setAdjError(e.message ?? "Could not add adjustment.");
      }
    });
  }

  function handlePermanentDelete() {
    setDeleteError(null);

    if (deleteTyped.trim() !== fullName.trim()) {
      setDeleteError(
        "Typed name doesn't match. Type the exact full name to confirm."
      );
      return;
    }

    startTransition(async () => {
      try {
        await deleteVolunteerPermanently(userId);

        setDeleteOpen(false);
        setDeleteTyped("");
      } catch (e: any) {
        setDeleteError(
          e.message ?? "Could not delete this account."
        );
      }
    });
  }

  function handleCropped(croppedBlob: Blob) {
    if (!rawPhotoFile) return;

    setPhotoError(null);

    const fd = new FormData();

    fd.append("photo", croppedBlob, "cropped.jpg");
    fd.append(
      "photo_original",
      rawPhotoFile,
      rawPhotoFile.name
    );

    startTransition(async () => {
      try {
        await setProfilePhoto(userId, fd);

        setPhotoOpen(false);
        setRawPhotoFile(null);
      } catch (e: any) {
        setPhotoError(e.message ?? "Upload failed.");
      }
    });
  }

  function handleEditSubmit() {
    setEditError(null);

    if (!editFullName.trim()) {
      setEditError("Full name cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        await updateVolunteerInfo(userId, {
          full_name: editFullName,
          department: editDepartment || null,
          phone: editPhone || null,
          roll_number: editRollNumber || null,
          year: editYear ? parseInt(editYear) : null,
        });

        setEditOpen(false);
      } catch (e: any) {
        setEditError(e.message ?? "Could not save changes.");
      }
    });
  }

  const modalOverlay =
    "fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm";

  const modalCard =
    "relative w-full max-w-md overflow-hidden rounded-3xl border border-steel bg-white shadow-2xl";

  const inputClass =
    "w-full rounded-xl border border-steel bg-white px-3 py-2.5 text-xs text-navy outline-none transition placeholder:text-navy/35 focus:border-brandblue focus:ring-2 focus:ring-brandblue/10";

  const labelClass =
    "mb-1.5 block text-[11px] font-semibold text-navy/70";

  return (
    <>
      {/* =====================================================
          ACTION BAR
      ===================================================== */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Position */}
        <div className="relative">
          <select
            defaultValue={currentPosition ?? ""}
            disabled={pending || status !== "active"}
            onChange={(e) =>
              handlePositionChange(e.target.value)
            }
            className="appearance-none rounded-xl border border-steel bg-white px-3 py-2 pr-8 text-xs font-semibold text-navy shadow-sm outline-none transition hover:border-slate-300 focus:border-brandblue focus:ring-2 focus:ring-brandblue/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              👤 Volunteer (No Head)
            </option>

            <optgroup label="⭐ Core Team Positions">
              {positions.map((p) => (
                <option key={p} value={p}>
                  ⭐ {p}
                </option>
              ))}
            </optgroup>

            <option value="__custom__">
              ✏️ Custom Position...
            </option>
          </select>

          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-navy/40">
            ▾
          </span>
        </div>

        {/* Tenure */}
        {status === "active" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              handleTenureChange(tenureYear === 1 ? 2 : 1)
            }
            title="Toggle between Year 1 and Year 2"
            className="rounded-xl border border-steel bg-steel/40 px-3 py-2 text-[11px] font-bold text-navy/70 transition hover:bg-steel disabled:opacity-50"
          >
            Year {tenureYear}
          </button>
        )}

        {/* Status actions */}
        {status === "active" ? (
          <div className="flex items-center gap-1.5">

            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmModal("graduate")}
              title="Mark tenure completed / Graduated"
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
            >
              <GraduationCap size={13} />
              Graduate
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmModal("remove")}
              title="Remove volunteer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-wheelred/20 bg-wheelred/5 px-2.5 py-2 text-[11px] font-bold text-wheelred transition hover:bg-wheelred/10 disabled:opacity-50"
            >
              <UserX size={13} />
              Remove
            </button>

          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => handleStatusUpdate("active")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Reactivate
          </button>
        )}

        {/* Edit */}
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditOpen(true)}
          title="Edit volunteer information"
          className="inline-flex items-center gap-1.5 rounded-xl border border-steel bg-white px-2.5 py-2 text-[11px] font-bold text-navy/60 shadow-sm transition hover:bg-steel/40 hover:text-navy disabled:opacity-50"
        >
          <Pencil size={13} />
          <span className="hidden xl:inline">Edit</span>
        </button>

        {/* Photo */}
        {currentPosition && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setPhotoOpen(true)}
            title="Set profile photo"
            className="inline-flex items-center gap-1.5 rounded-xl border border-brandblue/20 bg-brandblue/5 px-2.5 py-2 text-[11px] font-bold text-brandblue transition hover:bg-brandblue/10 disabled:opacity-50"
          >
            <Camera size={13} />
            <span className="hidden xl:inline">Photo</span>
          </button>
        )}

        {/* Permanent Delete */}
        <button
          type="button"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
          title="Permanently delete this account and all its history"
          className="inline-flex items-center gap-1.5 rounded-xl border border-steel bg-white px-2.5 py-2 text-[11px] font-bold text-navy/40 shadow-sm transition hover:border-wheelred/25 hover:bg-wheelred/5 hover:text-wheelred disabled:opacity-50"
        >
          <Trash2 size={13} />
          <span className="hidden xl:inline">Delete</span>
        </button>
      </div>

      {/* =====================================================
          EDIT INFO MODAL
      ===================================================== */}
      {editOpen && (
        <div
          className={modalOverlay}
          onMouseDown={() => {
            if (!pending) {
              setEditOpen(false);
              setEditError(null);
            }
          }}
        >
          <div
            className={modalCard}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-brandsaffron via-white to-brandgreen" />

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brandblue">
                    Official Controls
                  </p>

                  <h3 className="font-display text-lg font-bold text-navy">
                    Edit Volunteer Info
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-navy/50">
                    Update the volunteer's registered information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditError(null);
                  }}
                  className="rounded-xl p-2 text-navy/40 transition hover:bg-steel/50 hover:text-navy"
                >
                  <X size={17} />
                </button>
              </div>

              {editError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-wheelred/20 bg-wheelred/5 p-3 text-[11px] text-wheelred">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-4">

                <div>
                  <label className={labelClass}>
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) =>
                      setEditFullName(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Department
                  </label>

                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) =>
                      setEditDepartment(e.target.value)
                    }
                    placeholder="e.g. Computer Engineering"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Academic Year
                    </label>

                    <select
                      value={editYear}
                      onChange={(e) =>
                        setEditYear(e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Not set</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Phone
                    </label>

                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) =>
                        setEditPhone(e.target.value)
                      }
                      placeholder="+91 ..."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Roll / PRN Number
                  </label>

                  <input
                    type="text"
                    value={editRollNumber}
                    onChange={(e) =>
                      setEditRollNumber(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditError(null);
                  }}
                  className="flex-1 rounded-xl border border-steel py-2.5 text-xs font-bold text-navy/60 transition hover:bg-steel/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={handleEditSubmit}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brandblue py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brandblueDark disabled:opacity-50"
                >
                  {pending && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CUSTOM POSITION MODAL
      ===================================================== */}
      {customOpen && (
        <div
          className={modalOverlay}
          onMouseDown={() => {
            if (!pending) setCustomOpen(false);
          }}
        >
          <form
            onSubmit={handleCustomSubmit}
            className={modalCard}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-brandsaffron via-white to-brandgreen" />

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-saffron">
                    Core Team
                  </p>

                  <h3 className="font-display text-lg font-bold text-navy">
                    Set Custom Position
                  </h3>

                  <p className="mt-1 text-xs text-navy/50">
                    Assign a unique leadership title.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomOpen(false)}
                  className="rounded-xl p-2 text-navy/40 hover:bg-steel/50"
                >
                  <X size={17} />
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="e.g. Design & Media Head"
                value={customValue}
                onChange={(e) =>
                  setCustomValue(e.target.value)
                }
                className={inputClass}
              />

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCustomOpen(false);
                    setCustomValue("");
                  }}
                  className="flex-1 rounded-xl border border-steel py-2.5 text-xs font-bold text-navy/60 hover:bg-steel/40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brandblue py-2.5 text-xs font-bold text-white hover:bg-brandblueDark disabled:opacity-50"
                >
                  {pending && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}
                  Save Position
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          PROFILE PHOTO PICK
      ===================================================== */}
      {photoOpen && !rawPhotoFile && (
        <div className={modalOverlay}>
          <div className={modalCard}>
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brandblue">
                    Profile
                  </p>

                  <h3 className="font-display text-lg font-bold text-navy">
                    Set Profile Photo
                  </h3>

                  <p className="mt-1 text-xs text-navy/50">
                    Choose an image and adjust its crop.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPhotoOpen(false);
                    setPhotoError(null);
                  }}
                  className="rounded-xl p-2 text-navy/40 hover:bg-steel/50"
                >
                  <X size={17} />
                </button>
              </div>

              <label className="mb-2 block text-[11px] font-semibold text-navy/70">
                Select Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setRawPhotoFile(
                    e.target.files?.[0] ?? null
                  )
                }
                className="w-full rounded-xl border border-steel bg-white p-2 text-xs text-navy/60 file:mr-3 file:rounded-lg file:border-0 file:bg-brandblue/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-brandblue"
              />

              {photoError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-wheelred/20 bg-wheelred/5 p-3 text-[11px] text-wheelred">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                  />
                  {photoError}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setPhotoOpen(false);
                  setPhotoError(null);
                }}
                className="mt-5 w-full rounded-xl border border-steel py-2.5 text-xs font-bold text-navy/60 hover:bg-steel/40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PHOTO CROPPER
      ===================================================== */}
      {photoOpen && rawPhotoFile && (
        <PortraitCropper
          file={rawPhotoFile}
          onCancel={() => setRawPhotoFile(null)}
          onCropped={handleCropped}
        />
      )}

      {/* =====================================================
          GRADUATE / REMOVE CONFIRMATION
      ===================================================== */}
      {confirmModal && (
        <div className={modalOverlay}>
          <div className={modalCard}>
            <div
              className={`h-1.5 ${
                confirmModal === "graduate"
                  ? "bg-purple-500"
                  : "bg-wheelred"
              }`}
            />

            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    confirmModal === "graduate"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-wheelred/5 text-wheelred"
                  }`}
                >
                  {confirmModal === "graduate" ? (
                    <GraduationCap size={22} />
                  ) : (
                    <UserX size={20} />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="rounded-xl p-2 text-navy/40 hover:bg-steel/50"
                >
                  <X size={17} />
                </button>
              </div>

              <h3 className="font-display text-lg font-bold text-navy">
                {confirmModal === "graduate"
                  ? "Mark Tenure Completed?"
                  : "Remove Volunteer?"}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-navy/60">
                {confirmModal === "graduate"
                  ? "The system will check the Year 2 hour requirements and compulsory camp attendance before marking this volunteer as Graduated."
                  : "This deactivates the volunteer from the active roster. Their history remains available and they can be reactivated later."}
              </p>

              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 rounded-xl border border-steel py-2.5 text-xs font-bold text-navy/60 hover:bg-steel/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    handleStatusUpdate(
                      confirmModal === "graduate"
                        ? "graduated"
                        : "removed"
                    )
                  }
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                    confirmModal === "graduate"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-wheelred hover:bg-red-700"
                  }`}
                >
                  {pending && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}

                  {confirmModal === "graduate"
                    ? "Graduate Member"
                    : "Remove Volunteer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          REQUIREMENTS NOT MET
      ===================================================== */}
      {blocked && (
        <div className={modalOverlay}>
          <div className={`${modalCard} max-h-[90vh] overflow-y-auto`}>
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <AlertTriangle size={19} />
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-navy">
                      {blocked.kind === "promote"
                        ? "Requirements Not Met"
                        : "Graduation Requirements Not Met"}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-navy/50">
                      {blocked.kind === "promote"
                        ? "The volunteer cannot yet be promoted to Year 2."
                        : "The volunteer cannot yet be marked as graduated."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBlocked(null)}
                  className="rounded-xl p-2 text-navy/40 hover:bg-steel/50"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Eligibility breakdown */}
              <div className="space-y-2">
                {blocked.eligibility.breakdown.map((b) => (
                  <div
                    key={b.category}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-xs ${
                      b.met
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-wheelred/20 bg-wheelred/5"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-navy">
                      {b.met ? (
                        <CheckCircle2
                          size={15}
                          className="shrink-0 text-emerald-600"
                        />
                      ) : (
                        <XCircle
                          size={15}
                          className="shrink-0 text-wheelred"
                        />
                      )}

                      <span className="truncate">
                        {b.category}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 font-mono font-bold ${
                        b.met
                          ? "text-emerald-700"
                          : "text-wheelred"
                      }`}
                    >
                      {b.earned}/{b.required} hrs
                    </span>
                  </div>
                ))}

                {blocked.kind === "graduate" && (
                  <div
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-xs ${
                      blocked.eligibility.campAttended
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-wheelred/20 bg-wheelred/5"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-navy">
                      <Tent
                        size={15}
                        className={
                          blocked.eligibility.campAttended
                            ? "text-emerald-600"
                            : "text-wheelred"
                        }
                      />
                      Special Camp Attendance
                    </span>

                    <span
                      className={`font-bold ${
                        blocked.eligibility.campAttended
                          ? "text-emerald-700"
                          : "text-wheelred"
                      }`}
                    >
                      {blocked.eligibility.campAttended
                        ? "Attended"
                        : "Not attended"}
                    </span>
                  </div>
                )}
              </div>

              {/* Adjustment */}
              <div className="mt-5 rounded-2xl border border-steel bg-paper p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-brandblue/10 p-1.5 text-brandblue">
                    <PlusCircle size={14} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-navy">
                      Add Adjustment Hours
                    </p>

                    <p className="text-[10px] text-navy/45">
                      Official override for offline/missing records.
                    </p>
                  </div>
                </div>

                {adjError && (
                  <div className="mb-3 rounded-xl border border-wheelred/20 bg-wheelred/5 p-2.5 text-[11px] text-wheelred">
                    {adjError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={adjCategory}
                    onChange={(e) =>
                      setAdjCategory(e.target.value)
                    }
                    className={inputClass}
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="Hours"
                    value={adjHours}
                    onChange={(e) =>
                      setAdjHours(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Reason for adjustment"
                  value={adjReason}
                  onChange={(e) =>
                    setAdjReason(e.target.value)
                  }
                  className={`${inputClass} mt-2`}
                />

                <button
                  type="button"
                  disabled={pending}
                  onClick={handleAddAdjustment}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brandblue py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brandblueDark disabled:opacity-50"
                >
                  {pending && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}
                  Add Hours & Retry
                </button>
              </div>

              <button
                type="button"
                onClick={() => setBlocked(null)}
                className="mt-4 w-full py-2 text-xs font-bold text-navy/45 hover:text-navy/70"
              >
                Close without proceeding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PERMANENT DELETE
      ===================================================== */}
      {deleteOpen && (
        <div className={modalOverlay}>
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-wheelred/20 bg-white shadow-2xl">
            <div className="h-1.5 bg-wheelred" />

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-wheelred/5 text-wheelred">
                    <Trash2 size={20} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-wheelred">
                      Destructive Action
                    </p>

                    <h3 className="mt-0.5 font-display text-lg font-bold text-navy">
                      Permanently Delete Account?
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteTyped("");
                    setDeleteError(null);
                  }}
                  className="rounded-xl p-2 text-navy/40 hover:bg-steel/50"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="rounded-2xl border border-wheelred/15 bg-wheelred/5 p-3.5">
                <p className="text-xs leading-relaxed text-navy/65">
                  This{" "}
                  <strong className="text-wheelred">
                    permanently erases
                  </strong>{" "}
                  {fullName}'s login, profile, registrations,
                  attendance, hours, and hour adjustments.
                </p>

                <p className="mt-2 text-[11px] font-semibold text-wheelred">
                  This cannot be undone.
                </p>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-navy/70">
                  Type the exact name to confirm:
                </p>

                <div className="mb-2 rounded-xl bg-steel/30 px-3 py-2 font-mono text-xs font-bold text-navy">
                  {fullName}
                </div>

                <input
                  type="text"
                  value={deleteTyped}
                  onChange={(e) =>
                    setDeleteTyped(e.target.value)
                  }
                  placeholder="Type full name exactly"
                  className={`${inputClass} border-wheelred/20 focus:border-wheelred`}
                />

                {deleteError && (
                  <div className="mt-2 rounded-xl border border-wheelred/20 bg-wheelred/5 p-2.5 text-[11px] text-wheelred">
                    {deleteError}
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteTyped("");
                    setDeleteError(null);
                  }}
                  className="flex-1 rounded-xl border border-steel py-2.5 text-xs font-bold text-navy/60 transition hover:bg-steel/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    pending ||
                    deleteTyped.trim() !== fullName.trim()
                  }
                  onClick={handlePermanentDelete}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-wheelred py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}