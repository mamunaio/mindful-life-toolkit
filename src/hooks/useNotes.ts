import { useState, useEffect } from "react";

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface NotesData {
  journal: JournalEntry[];
  brainDump: string;
  checklists: Checklist[];
}

const EMPTY: NotesData = { journal: [], brainDump: "", checklists: [] };

function load(): NotesData {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem("lifehub-notes") || "{}") };
  } catch {
    return EMPTY;
  }
}

function save(data: NotesData) {
  localStorage.setItem("lifehub-notes", JSON.stringify(data));
}

export function useNotes() {
  const [data, setData] = useState<NotesData>(load);

  useEffect(() => { save(data); }, [data]);

  const addJournalEntry = (content: string) => {
    const entry: JournalEntry = { id: crypto.randomUUID(), date: new Date().toISOString(), content };
    setData((d) => ({ ...d, journal: [entry, ...d.journal] }));
  };

  const deleteJournalEntry = (id: string) => {
    setData((d) => ({ ...d, journal: d.journal.filter((e) => e.id !== id) }));
  };

  const setBrainDump = (text: string) => {
    setData((d) => ({ ...d, brainDump: text }));
  };

  const addChecklist = (name: string) => {
    setData((d) => ({
      ...d,
      checklists: [...d.checklists, { id: crypto.randomUUID(), name, items: [] }],
    }));
  };

  const deleteChecklist = (id: string) => {
    setData((d) => ({ ...d, checklists: d.checklists.filter((c) => c.id !== id) }));
  };

  const addChecklistItem = (checklistId: string, text: string) => {
    setData((d) => ({
      ...d,
      checklists: d.checklists.map((c) =>
        c.id === checklistId
          ? { ...c, items: [...c.items, { id: crypto.randomUUID(), text, done: false }] }
          : c
      ),
    }));
  };

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    setData((d) => ({
      ...d,
      checklists: d.checklists.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : c
      ),
    }));
  };

  const deleteChecklistItem = (checklistId: string, itemId: string) => {
    setData((d) => ({
      ...d,
      checklists: d.checklists.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c
      ),
    }));
  };

  return {
    ...data,
    addJournalEntry, deleteJournalEntry,
    setBrainDump,
    addChecklist, deleteChecklist,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  };
}
