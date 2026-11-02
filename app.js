'use strict';

const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const descriptionInput = document.querySelector('#task-description');
const submit = document.querySelector('#task-submit');
const cancel = document.querySelector('#cancel-edit');
const list = document.querySelector('#task-list');
const status = document.querySelector('#status-message');
const refresh = document.querySelector('#refresh-tasks');
let config;
let editingId = null;
let busy = false;

function message(text, error = false) {
  status.textContent = text;
  status.classList.toggle('error', error);
}

function lock(value) {
  busy = value;
  document.querySelector('#task-fields').disabled = value || !config;
  refresh.disabled = value || !config;
  list.querySelectorAll('button').forEach(button => { button.disabled = value; });
  list.setAttribute('aria-busy', String(value));
}

async function request(query = '', method = 'GET', body) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}${query}`, {
    method,
    headers: { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { throw new Error('The database returned an unreadable response. Please retry.'); }
  if (!response.ok) throw new Error(data?.message || `Database request failed (${response.status}).`);
  return data;
}

function resetForm() {
  editingId = null;
  form.reset();
  submit.textContent = 'Add task';
  document.querySelector('#form-heading').textContent = 'Add a task';
  cancel.hidden = true;
}

function render(tasks) {
  list.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'A fresh start. Add your first task to get going.';
    list.append(empty);
  }
  for (const task of tasks) {
    const item = document.createElement('article');
    item.className = `task-item${task.completed ? ' is-completed' : ''}`;
    item.dataset.id = String(task.id);
    for (const [tag, className, value] of [
      ['h3', 'task-title', task.title],
      ['p', 'task-description', task.description || ''],
      ['span', 'task-status', task.completed ? 'Completed' : 'Incomplete']
    ]) {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = value;
      item.append(element);
    }
    const actions = document.createElement('div');
    actions.className = 'actions';
    for (const [className, label, handler] of [
      ['toggle-task', task.completed ? 'Mark incomplete' : 'Mark complete', () => toggleTask(task)],
      ['edit-task secondary', 'Edit', () => editTask(task.id)],
      ['delete-task', 'Delete', event => deleteTask(task.id, event.currentTarget)]
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      button.disabled = busy;
      button.addEventListener('click', handler);
      actions.append(button);
    }
    item.append(actions);
    list.append(item);
  }
}

async function loadTasks() {
  const tasks = await request('?select=*&order=id.asc');
  render(tasks);
}

async function run(action) {
  if (busy) return;
  lock(true);
  try { await action(); }
  catch (error) {
    const text = ['TimeoutError', 'AbortError'].includes(error.name)
      ? 'The database took too long to respond. Refresh to check the result before retrying.'
      : error instanceof TypeError ? 'Cannot reach the database. Check your connection and try Refresh.' : error.message;
    message(text, true);
  } finally { lock(false); }
}

function editTask(id) {
  return run(async () => {
    const rows = await request(`?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows.length) throw new Error('This task no longer exists. Refresh the list.');
    const task = rows[0];
    editingId = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    submit.textContent = 'Save changes';
    document.querySelector('#form-heading').textContent = 'Edit task';
    cancel.hidden = false;
    message('Editing task. Make your changes and choose Save changes.');
  }).then(() => { titleInput.focus(); });
}

async function mutate(query, method, body, success, reset = false) {
  const rows = await request(query, method, body);
  if (!Array.isArray(rows) || !rows.length) throw new Error('No task was changed. Refresh the list and try again.');
  if (reset) resetForm();
  try { await loadTasks(); message(success); }
  catch { message(`${success} The list could not refresh. Choose Refresh to see the latest tasks.`, true); }
}

function toggleTask(task) {
  return run(() => mutate(`?id=eq.${encodeURIComponent(task.id)}`, 'PATCH', { completed: !task.completed }, 'Task status updated.'));
}

function deleteTask(id, button) {
  if (busy) return;
  if (button.dataset.confirm !== 'true') {
    button.dataset.confirm = 'true';
    button.textContent = 'Confirm delete';
    const cancelDelete = document.createElement('button');
    cancelDelete.type = 'button';
    cancelDelete.className = 'secondary';
    cancelDelete.textContent = 'Keep task';
    cancelDelete.addEventListener('click', () => {
      delete button.dataset.confirm;
      button.textContent = 'Delete';
      cancelDelete.remove();
      message('Deletion cancelled.');
    });
    button.after(cancelDelete);
    message('Choose Confirm delete to remove this task, or Keep task to cancel.');
    return;
  }
  return run(() => mutate(`?id=eq.${encodeURIComponent(id)}`, 'DELETE', undefined, 'Task deleted.', editingId === id));
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) { message('Please enter a task title.', true); titleInput.focus(); return; }
  const data = { title, description: descriptionInput.value.trim() };
  const isEditing = editingId !== null;
  const query = isEditing ? `?id=eq.${encodeURIComponent(editingId)}` : '';
  if (!isEditing) data.completed = false;
  run(() => mutate(query, isEditing ? 'PATCH' : 'POST', data, isEditing ? 'Task updated.' : 'Task added.', true));
});
cancel.addEventListener('click', () => { resetForm(); message('Edit cancelled.'); });
refresh.addEventListener('click', () => run(async () => { await loadTasks(); message('Tasks refreshed.'); }));

run(async () => {
  const response = await fetch('config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load config.json.');
  const settings = await response.json();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(settings.supabaseUrl) ||
      !settings.supabasePublishableKey?.startsWith('sb_publishable_') || settings.tableName !== 'tasks') {
    throw new Error('Database setup is pending. Add the Supabase project URL and public publishable key to config.json.');
  }
  config = { ...settings, supabaseUrl: settings.supabaseUrl.replace(/\/$/, '') };
  await loadTasks();
  message('Your tasks are up to date.');
});
