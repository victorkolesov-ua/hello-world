const STORAGE_KEY = "task-manager-items";

const form = document.querySelector("[data-task-form]");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("[data-task-list]");
const emptyState = document.querySelector("[data-empty-state]");
const taskCount = document.querySelector("[data-task-count]");
const taskTemplate = document.querySelector("#task-item-template");

let tasks = loadTasks();

renderTasks();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = input.value.trim();

  if (!value) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: createTaskId(),
    text: value,
  });

  persistTasks();
  renderTasks();
  form.reset();
  input.focus();
});

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(savedTasks)
      ? savedTasks.filter((task) => task && typeof task.id === "string" && typeof task.text === "string")
      : [];
  } catch {
    return [];
  }
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const taskItem = taskTemplate.content.firstElementChild.cloneNode(true);
    const textElement = taskItem.querySelector("[data-task-text]");
    const editButton = taskItem.querySelector("[data-edit-task]");
    const deleteButton = taskItem.querySelector("[data-delete-task]");
    const editForm = taskItem.querySelector("[data-edit-form]");
    const editInput = editForm.querySelector('input[name="editTask"]');
    const cancelEditButton = taskItem.querySelector("[data-cancel-edit]");

    textElement.textContent = task.text;
    editInput.value = task.text;

    editButton.addEventListener("click", () => {
      textElement.classList.add("is-hidden");
      editForm.classList.remove("is-hidden");
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    });

    cancelEditButton.addEventListener("click", () => {
      editInput.value = task.text;
      editForm.classList.add("is-hidden");
      textElement.classList.remove("is-hidden");
    });

    editForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const nextValue = editInput.value.trim();

      if (!nextValue) {
        editInput.focus();
        return;
      }

      tasks = tasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              text: nextValue,
            }
          : currentTask
      );

      persistTasks();
      renderTasks();
    });

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
      persistTasks();
      renderTasks();
    });

    taskList.appendChild(taskItem);
  });

  const tasksTotal = tasks.length;
  taskCount.textContent = `${tasksTotal} ${getTaskLabel(tasksTotal)}`;
  emptyState.classList.toggle("is-hidden", tasksTotal > 0);
}

function getTaskLabel(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "завдання";
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return "завдання";
  }

  return "завдань";
}
