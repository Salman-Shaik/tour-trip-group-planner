export type FormState = {
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

export function formValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries(), ([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}
