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

export default function AdminPsychologistsPage() {
  const [items, setItems] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [psychologistToDelete, setPsychologistToDelete] =
    useState<Psychologist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      <div className={css.table}>
        {items.map((item) => (
          <div key={item.id} className={css.row}>
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
              <button className={css.editBtn} onClick={() => openEdit(item)}>
                Edit
              </button>

              <button
                className={css.deleteBtn}
                onClick={() => setPsychologistToDelete(item)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onCloseModal={closeModal}>
          <Formik
            key={editingId || "create"}
            initialValues={initialValues}
            enableReinitialize
            validationSchema={psychologistSchema}
            onSubmit={handleSave}
          >
            {({ isSubmitting, values }) => (
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
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
