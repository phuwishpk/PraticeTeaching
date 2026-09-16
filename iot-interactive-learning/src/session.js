// localStorage, not sessionStorage: closing a tab or locking a phone must not cost a
// learner the seat their score is attached to.
const NAME_KEY = 'student_name';
const STUDENT_TOKEN_KEY = 'student_token';
// The seat id changes when another device claims the name, which is how this tab notices.
const ID_KEY = 'student_id';

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
export const getStudentId = () => read(ID_KEY);
export const saveStudent = (name, token, id) => {
  write(NAME_KEY, name);
  if (token) write(STUDENT_TOKEN_KEY, token);
  if (id) write(ID_KEY, id);
};
export const clearStudent = () => {
  remove(NAME_KEY);
  remove(STUDENT_TOKEN_KEY);
  remove(ID_KEY);
};

// Why this tab dropped back to the PIN screen: 'taken-over' when another device claimed
// the name, 'removed' when the seat is simply gone. Per-tab and read once, so it belongs
// in sessionStorage rather than alongside the seat itself.
const EXIT_KEY = 'exit_reason';
export const markExit = reason => {
  try { sessionStorage.setItem(EXIT_KEY, reason); } catch { /* nothing to record */ }
};
export const readExit = () => {
  try {
    const reason = sessionStorage.getItem(EXIT_KEY) || '';
    sessionStorage.removeItem(EXIT_KEY);
    return reason;
  } catch { return ''; }
};
