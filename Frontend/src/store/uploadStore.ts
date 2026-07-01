import { create } from "zustand";

export type InputMode = "title" | "jd";

interface UploadStore {
  file: File | null;
  inputMode: InputMode;
  jobTitle: string;
  jdText: string;
  setFile: (file: File) => void;
  setInputMode: (mode: InputMode) => void;
  setJobTitle: (title: string) => void;
  setJdText: (text: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  file: null,
  inputMode: "jd",       // default: paste JD
  jobTitle: "",
  jdText: "",
  setFile: (file) => set({ file }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setJobTitle: (title) => set({ jobTitle: title }),
  setJdText: (text) => set({ jdText: text }),
  reset: () => set({ file: null, inputMode: "jd", jobTitle: "", jdText: "" }),
}));