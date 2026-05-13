"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  useFormikContext,
  type FormikHelpers,
} from "formik";
import * as Yup from "yup";
import { db } from "@/lib/firebase";
import {
  ref as databaseRef,
  get,
  remove,
  push,
  set,
  update,
} from "firebase/database";
import toast from "react-hot-toast";
import Loader from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import { getPsychologistRating } from "@/lib/psychologistFilters";
import {
  initialPsychologistFormDraft,
  usePsychologistFormStore,
  type PsychologistFormDraft,
} from "@/stores/usePsychologistFormStore";
import type { Psychologist } from "@/types/psychologist";
import css from "./page.module.css";

const CLOUDINARY_CLOUD_NAME = "dxyikhan7";
const CLOUDINARY_UPLOAD_PRESET = "pvmwu8uu";
const CLOUDINARY_FOLDER = "psychologists";

const psychologistSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Minimum 2 characters")
    .required("Name is required"),
  specialization: Yup.string()
    .trim()
    .min(2, "Minimum 2 characters")
    .required("Specialization is required"),
  experience: Yup.string()
    .trim()
    .min(1, "Minimum 1 character")
    .required("Experience is required"),
  license: Yup.string()
    .trim()
    .min(2, "Minimum 2 characters")
    .required("License is required"),
  initial_consultation: Yup.string()
    .trim()
    .min(2, "Minimum 2 characters")
    .required("Initial consultation is required"),
  about: Yup.string()
    .trim()
    .min(20, "Minimum 20 characters")
    .required("About is required"),
  avatar_url: Yup.string().trim().url("Invalid image URL"),
  price_per_hour: Yup.number()
    .typeError("Price must be a number")
    .min(0, "Price cannot be negative")
    .required("Price is required"),
});

type PsychologistSort =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "rating-desc";

type ProfileFilter = "all" | "complete" | "incomplete";

const SORT_OPTIONS: { value: PsychologistSort; label: string }[] = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "price-asc", label: "Price low-high" },
  { value: "price-desc", label: "Price high-low" },
  { value: "rating-desc", label: "Rating high-low" },
];

const isProfileComplete = (psychologist: Psychologist) =>
  Boolean(
    psychologist.name?.trim() &&
      psychologist.specialization?.trim() &&
      psychologist.avatar_url?.trim() &&
      psychologist.experience?.trim() &&
      psychologist.license?.trim() &&
      psychologist.initial_consultation?.trim() &&
      psychologist.about?.trim() &&
      Number.isFinite(Number(psychologist.price_per_hour))
  );

const AutoSave = ({
  disabled,
  onSave,
}: {
  disabled: boolean;
  onSave: (values: PsychologistFormDraft) => void;
}) => {
  const { values } = useFormikContext<PsychologistFormDraft>();

  useEffect(() => {
    if (!disabled) onSave(values);
  }, [disabled, onSave, values]);

  return null;
};

const AvatarImage = ({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src?: string;
  alt: string;
  className: string;
  fallbackClassName: string;
}) => {
  const normalizedSrc = src?.trim() || "";
  const [failedSrc, setFailedSrc] = useState("");

  if (!normalizedSrc || failedSrc === normalizedSrc) {
    return (
      <div className={fallbackClassName}>
        {(alt.charAt(0) || "?").toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={normalizedSrc}
      alt={alt}
      onError={() => setFailedSrc(normalizedSrc)}
    />
  );
};

const ValidationToast = () => {
  const { errors, isValid, submitCount } =
    useFormikContext<PsychologistFormDraft>();

  useEffect(() => {
    if (submitCount === 0 || isValid) return;

    const firstError = Object.values(errors)[0];
    if (firstError) toast.error(String(firstError));
  }, [errors, isValid, submitCount]);

  return null;
};

const uploadPsychologistImage = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", CLOUDINARY_FOLDER);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed.");
  }

  return data.secure_url;
};

export default function AdminPsychologistsPage() {
  const [items, setItems] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Psychologist | null>(null);
  const [psychologistToDelete, setPsychologistToDelete] =
    useState<Psychologist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PsychologistSort>("name-asc");
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>("all");

  const { draft, setDraft, clearDraft } = usePsychologistFormStore();

  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    try {
      const snapshot = await get(databaseRef(db, "psychologists"));

      if (!snapshot.exists()) {
        setItems([]);
        return;
      }

      const data = snapshot.val();

      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<Psychologist, "id">),
      }));

      setItems(list);
    } catch {
      toast.error("Failed to load psychologists.");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setIsOpen(true);
  };

  const openEdit = (psychologist: Psychologist) => {
    setEditingId(psychologist.id);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  const handleSave = async (
    values: PsychologistFormDraft,
    { setSubmitting }: FormikHelpers<PsychologistFormDraft>
  ) => {
    try {
      const payload = {
        name: values.name.trim(),
        avatar_url: values.avatar_url.trim(),
        specialization: values.specialization.trim(),
        experience: values.experience.trim(),
        license: values.license.trim(),
        initial_consultation: values.initial_consultation.trim(),
        about: values.about.trim(),
        price_per_hour: Number(values.price_per_hour),
      };

      if (editingId) {
        await update(databaseRef(db, `psychologists/${editingId}`), payload);
        toast.success("Psychologist updated.");
      } else {
        const newRef = push(databaseRef(db, "psychologists"));

        await set(newRef, {
          ...payload,
          rating: 0,
        });
        clearDraft();
        toast.success("Psychologist created.");
      }

      closeModal();
      loadPsychologists();
    } catch {
      toast.error("Failed to save psychologist.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!psychologistToDelete) return;

    setIsDeleting(true);

    try {
      await remove(databaseRef(db, `psychologists/${psychologistToDelete.id}`));
      setItems((prev) =>
        prev.filter((item) => item.id !== psychologistToDelete.id)
      );
      setPsychologistToDelete(null);
      toast.success("Psychologist deleted.");
    } catch {
      toast.error("Failed to delete psychologist.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const editingItem = items.find((item) => item.id === editingId);
  const visibleItems = items
    .filter((item) => {
      const normalizedQuery = query.trim().toLowerCase();
      const isComplete = isProfileComplete(item);

      if (profileFilter === "complete" && !isComplete) return false;
      if (profileFilter === "incomplete" && isComplete) return false;

      if (!normalizedQuery) return true;

      return [
        item.name,
        item.specialization,
        item.license,
        item.about,
        String(item.price_per_hour),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return Number(a.price_per_hour) - Number(b.price_per_hour);
        case "price-desc":
          return Number(b.price_per_hour) - Number(a.price_per_hour);
        case "rating-desc":
          return (getPsychologistRating(b) ?? 0) - (getPsychologistRating(a) ?? 0);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  const initialValues: PsychologistFormDraft = editingItem
    ? {
        name: editingItem.name,
        avatar_url: editingItem.avatar_url || "",
        specialization: editingItem.specialization || "",
        experience: editingItem.experience || "",
        license: editingItem.license || "",
        initial_consultation: editingItem.initial_consultation || "",
        about: editingItem.about || "",
        price_per_hour: String(editingItem.price_per_hour),
      }
    : {
        ...initialPsychologistFormDraft,
        ...draft,
      };

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Psychologists</h1>
          <p>Manage specialists list</p>
        </div>

        <button onClick={openCreate} className={css.addBtn}>
          Add psychologist
        </button>
      </div>

      <section className={css.controls} aria-label="Psychologist filters">
        <label className={css.searchBox}>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, specialization, license"
          />
        </label>

        <label className={css.controlField}>
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as PsychologistSort)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={css.filterGroup}>
          <span>Profile</span>
          <div className={css.statusFilters}>
            {(["all", "complete", "incomplete"] as ProfileFilter[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setProfileFilter(status)}
                  className={
                    profileFilter === status
                      ? css.activeFilter
                      : css.filterBtn
                  }
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      <div className={css.table}>
        {visibleItems.length === 0 && (
          <div className={css.emptyState}>No psychologists match these filters.</div>
        )}

        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={css.row}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPsychologist(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedPsychologist(item);
              }
            }}
          >
            <div className={css.main}>
              <div className={css.person}>
                <AvatarImage
                  className={css.avatar}
                  fallbackClassName={css.avatarPlaceholder}
                  src={item.avatar_url}
                  alt={item.name}
                />

                <div>
                  <strong>{item.name}</strong>

                  <p>{item.specialization}</p>
                </div>
              </div>
            </div>

            <div className={css.price}>${item.price_per_hour}</div>

            <div className={css.rating}>
              ⭐ {getPsychologistRating(item) ?? 0}
            </div>

            <div className={css.actions}>
              <button
                className={css.editBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  openEdit(item);
                }}
              >
                Edit
              </button>

              <button
                className={css.deleteBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  setPsychologistToDelete(item);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selectedPsychologist)}
        onCloseModal={() => setSelectedPsychologist(null)}
      >
        {selectedPsychologist && (
          <div className={css.detailsModal}>
            <div className={css.detailsHeader}>
              <AvatarImage
                className={css.detailsAvatar}
                fallbackClassName={css.detailsAvatarPlaceholder}
                src={selectedPsychologist.avatar_url}
                alt={selectedPsychologist.name}
              />

              <div>
                <span className={css.detailsEyebrow}>Psychologist profile</span>
                <h2>{selectedPsychologist.name}</h2>
                <p>{selectedPsychologist.specialization || "No specialization"}</p>
              </div>
            </div>

            <div className={css.detailsGrid}>
              <div>
                <span>Price</span>
                <strong>${selectedPsychologist.price_per_hour}</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>{getPsychologistRating(selectedPsychologist) ?? 0}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{selectedPsychologist.experience || "Not specified"}</strong>
              </div>
              <div>
                <span>License</span>
                <strong>{selectedPsychologist.license || "Not specified"}</strong>
              </div>
              <div className={css.detailsWide}>
                <span>Initial consultation</span>
                <strong>
                  {selectedPsychologist.initial_consultation || "Not specified"}
                </strong>
              </div>
            </div>

            <div className={css.detailsAbout}>
              <span>About</span>
              <p>{selectedPsychologist.about || "No description yet."}</p>
            </div>

            <div className={css.modalActions}>
              <button
                type="button"
                className={css.editBtn}
                onClick={() => {
                  const current = selectedPsychologist;
                  setSelectedPsychologist(null);
                  openEdit(current);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={() => {
                  setPsychologistToDelete(selectedPsychologist);
                  setSelectedPsychologist(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isOpen} onCloseModal={closeModal}>
          <Formik
            key={editingId || "create"}
            initialValues={initialValues}
            enableReinitialize
            validationSchema={psychologistSchema}
            onSubmit={handleSave}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className={css.modal}>
                <AutoSave disabled={Boolean(editingId)} onSave={setDraft} />
                <ValidationToast />

                <h2>{editingId ? "Edit psychologist" : "Add psychologist"}</h2>

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="name">
                    Name
                  </label>
                  <Field id="name" name="name" placeholder="Dr. Amanda Davis" />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="avatar_url">
                    Image URL
                  </label>
                  <Field
                    id="avatar_url"
                    name="avatar_url"
                    placeholder="https://example.com/photo.jpg"
                  />
                  <ErrorMessage
                    name="avatar_url"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.uploadField}>
                  <label className={css.uploadButton}>
                    <input
                      type="file"
                      accept="image/*"
                      className={css.fileInput}
                      disabled={isUploadingImage || isSubmitting}
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];

                        if (!file) return;

                        setIsUploadingImage(true);

                        try {
                          const imageUrl = await uploadPsychologistImage(file);
                          await setFieldValue("avatar_url", imageUrl, true);
                          toast.success("Image uploaded.");
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Image upload failed."
                          );
                        } finally {
                          setIsUploadingImage(false);
                          input.value = "";
                        }
                      }}
                    />
                    {isUploadingImage ? "Uploading..." : "Upload image"}
                  </label>
                  <span className={css.uploadHint}>
                    Uploads to Cloudinary and fills Image URL automatically.
                  </span>
                </div>

                <AvatarImage
                  className={css.preview}
                  fallbackClassName={css.previewPlaceholder}
                  src={values.avatar_url}
                  alt={values.name || "Psychologist"}
                />

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="specialization">
                    Specialization
                  </label>
                  <Field
                    id="specialization"
                    name="specialization"
                    placeholder="Anxiety and Stress Management"
                  />
                  <ErrorMessage
                    name="specialization"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="experience">
                    Experience
                  </label>
                  <Field
                    id="experience"
                    name="experience"
                    placeholder="8 years"
                  />
                  <ErrorMessage
                    name="experience"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="license">
                    License
                  </label>
                  <Field
                    id="license"
                    name="license"
                    placeholder="Licensed Psychologist (License #54321)"
                  />
                  <ErrorMessage
                    name="license"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.fieldWrapper}>
                  <label
                    className={css.fieldLabel}
                    htmlFor="initial_consultation"
                  >
                    Initial consultation
                  </label>
                  <Field
                    id="initial_consultation"
                    name="initial_consultation"
                    placeholder="Free 30-minute initial consultation"
                  />
                  <ErrorMessage
                    name="initial_consultation"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="about">
                    About psychologist
                  </label>
                  <Field
                    id="about"
                    as="textarea"
                    name="about"
                    placeholder="Write a short professional description"
                    className={css.textarea}
                  />
                  <ErrorMessage
                    name="about"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.fieldWrapper}>
                  <label className={css.fieldLabel} htmlFor="price_per_hour">
                    Price per hour
                  </label>
                  <Field
                    id="price_per_hour"
                    name="price_per_hour"
                    placeholder="170"
                  />
                  <ErrorMessage
                    name="price_per_hour"
                    component="div"
                    className={css.error}
                  />
                </div>

                <div className={css.modalActions}>
                  <button
                    type="submit"
                    className={css.saveBtn}
                    disabled={isSubmitting || isUploadingImage}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : isUploadingImage
                        ? "Uploading..."
                        : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className={css.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
      </Modal>

      <Modal
        isOpen={Boolean(psychologistToDelete)}
        onCloseModal={() => !isDeleting && setPsychologistToDelete(null)}
      >
        <div className={css.confirmModal}>
          <h2>Delete psychologist?</h2>
          <p>
            This will permanently remove {psychologistToDelete?.name} and all
            related reviews.
          </p>

          <div className={css.modalActions}>
            <button
              type="button"
              className={css.deleteBtn}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>

            <button
              type="button"
              onClick={() => setPsychologistToDelete(null)}
              className={css.cancelBtn}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
