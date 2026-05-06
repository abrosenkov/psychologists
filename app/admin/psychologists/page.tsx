"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get, remove, push, set, update } from "firebase/database";
import css from "./page.module.css";

interface Psychologist {
  id: string;
  name: string;
  avatar_url: string;
  price_per_hour: number;
  rating: number;
  specialization: string;
}

interface FormState {
  name: string;
  specialization: string;
  price_per_hour: string;
  rating: string;
}

const initialForm: FormState = {
  name: "",
  specialization: "",
  price_per_hour: "",
  rating: "",
};

export default function AdminPsychologistsPage() {
  const [items, setItems] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    try {
      const snapshot = await get(ref(db, "psychologists"));

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
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsOpen(true);
  };

  const openEdit = (psychologist: Psychologist) => {
    setEditingId(psychologist.id);

    setForm({
      name: psychologist.name,
      specialization: psychologist.specialization,
      price_per_hour: String(psychologist.price_per_hour),
      rating: String(psychologist.rating),
    });

    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.specialization.trim()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      price_per_hour: Number(form.price_per_hour) || 0,
      rating: Number(form.rating) || 0,
    };

    if (editingId) {
      await update(ref(db, `psychologists/${editingId}`), payload);
    } else {
      const newRef = push(ref(db, "psychologists"));

      await set(newRef, payload);
    }

    closeModal();
    loadPsychologists();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete psychologist?");

    if (!confirmed) return;

    await remove(ref(db, `psychologists/${id}`));

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return <p>Loading...</p>;
  }

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
              <strong>{item.name}</strong>

              <p>{item.specialization}</p>
            </div>

            <div className={css.price}>${item.price_per_hour}</div>

            <div className={css.rating}>⭐ {item.rating}</div>

            <div className={css.actions}>
              <button className={css.editBtn} onClick={() => openEdit(item)}>
                Edit
              </button>

              <button
                className={css.deleteBtn}
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className={css.overlay}>
          <div className={css.modal}>
            <h2>{editingId ? "Edit psychologist" : "Add psychologist"}</h2>

            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Specialization"
              value={form.specialization}
              onChange={(e) =>
                setForm({
                  ...form,
                  specialization: e.target.value,
                })
              }
            />

            <input
              placeholder="Price"
              value={form.price_per_hour}
              onChange={(e) =>
                setForm({
                  ...form,
                  price_per_hour: e.target.value,
                })
              }
            />

            <input
              placeholder="Rating"
              value={form.rating}
              onChange={(e) =>
                setForm({
                  ...form,
                  rating: e.target.value,
                })
              }
            />

            <div className={css.modalActions}>
              <button onClick={handleSave} className={css.saveBtn}>
                Save
              </button>

              <button onClick={closeModal} className={css.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
