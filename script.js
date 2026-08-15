const STORAGE_KEY = "task-manager-items";

const form = document.querySelector("#task-form");
const descriptionInput = document.querySelector("#task-description");
const dateInput = document.querySelector("#task-date");
const timeInput = document.querySelector("#task-time");
const taskTableBody = document.querySelector("#task-table-body");
const emptyState = document.querySelector("#empty-state");
const taskCounter = document.querySelector("#task-counter");
const activeCount = document.querySelector("#active-count");
const completedCount = document.querySelector("#completed-count");
const taskFilter = document.querySelector("#task-filter");
const taskSearch = document.querySelector("#task-search");
const clearCompletedButton = document.querySelector("#clear-completed");
const taskTemplate = document.querySelector("#task-row-template");

let tasks = loadTasks();

renderTasks();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;

  if (!description || !date || !time) {
    const firstEmpty = !description ? descriptionInput : !date ? dateInput : timeInput;
    firstEmpty.focus();
    return;
  }

  tasks.unshift({
    id: createTaskId(),
    description,
    date,
    time,
    completed: false,
  });

  persistTasks();
  form.reset();
  descriptionInput.focus();
  renderTasks();
});

taskFilter.addEventListener("change", renderTasks);
taskSearch.addEventListener("input", renderTasks);
clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  persistTasks();
  renderTasks();
});

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(savedTasks)) {
      return [];
    }

    return savedTasks
      .filter((task) => task && typeof task.id === "string")
      .map((task) => ({
        id: task.id,
        description: typeof task.description === "string" ? task.description : "",
        date: typeof task.date === "string" ? task.date : "",
        time: typeof task.time === "string" ? task.time : "",
        completed: Boolean(task.completed),
      }))
      .filter((task) => task.description);
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
  const visibleTasks = getVisibleTasks();
  taskTableBody.innerHTML = "";

  visibleTasks.forEach((task) => {
    const row = taskTemplate.content.firstElementChild.cloneNode(true);
    const textCell = row.querySelector(".task-text");
    const dateCell = row.querySelector(".task-date");
    const timeCell = row.querySelector(".task-time");
    const checkbox = row.querySelector(".task-complete");
    const editButton = row.querySelector(".task-edit");
    const deleteButton = row.querySelector(".task-delete");

    textCell.textContent = task.description;
    dateCell.textContent = formatDate(task.date);
    timeCell.textContent = task.time || "--:--";
    checkbox.checked = task.completed;
    row.classList.toggle("is-completed", task.completed);

    checkbox.addEventListener("change", () => {
      tasks = tasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
            ...currentTask,
            completed: checkbox.checked,
          }
          : currentTask
      );

      persistTasks();
      renderTasks();
    });

    editButton.addEventListener("click", () => {
      const nextDescription = window.prompt("Редагувати опис задачі:", task.description);

      if (nextDescription === null) {
        return;
      }

      const updatedDescription = nextDescription.trim();

      if (!updatedDescription) {
        window.alert("Опис задачі не може бути порожнім.");
        return;
      }

      tasks = tasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
            ...currentTask,
            description: updatedDescription,
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

    taskTableBody.appendChild(row);
  });

  const tasksTotal = tasks.length;
  const completedTotal = tasks.filter((task) => task.completed).length;
  const activeTotal = tasksTotal - completedTotal;

  taskCounter.textContent = `${visibleTasks.length} із ${tasksTotal} ${getTaskLabel(tasksTotal)}`;
  activeCount.textContent = String(activeTotal);
  completedCount.textContent = String(completedTotal);
  emptyState.hidden = visibleTasks.length > 0;
}

function getVisibleTasks() {
  const selectedFilter = taskFilter.value;
  const query = taskSearch.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" && !task.completed) ||
      (selectedFilter === "completed" && task.completed);

    const matchesSearch = !query || task.description.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
