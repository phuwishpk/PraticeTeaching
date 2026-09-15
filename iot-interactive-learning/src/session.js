// localStorage, not sessionStorage: closing a tab or locking a phone must not cost a
// learner the seat their score is attached to.
const NAME_KEY = 'student_name';
const STUDENT_TOKEN_KEY = 'student_token';

const read = key => {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* private mode — the session just will not survive a reload */ }
};
const remove = key => {
  try { localStorage.removeItem(key); } catch { /* nothing to clean up */ }
};

export const getStudentName = () => read(NAME_KEY);
export const getStudentToken = () => read(STUDENT_TOKEN_KEY);
export const saveStudent = (name, token) => {
  write(NAME_KEY, name);
  if (token) write(STUDENT_TOKEN_KEY, token);
};
export const clearStudent = () => {
  remove(NAME_KEY);
  remove(STUDENT_TOKEN_KEY);
};
