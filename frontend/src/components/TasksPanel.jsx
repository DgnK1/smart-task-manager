import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const STATUS_STYLES = {
  todo: "status-chip status-chip-todo",
  in_progress: "status-chip status-chip-in-progress",
  done: "status-chip status-chip-done",
};

const getStatusLabel = (value) =>
  STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

const formatDueDate = (value) => {
  if (!value) return "N/A";

  const normalized = String(value).slice(0, 10);
  const parsedDate = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

export default function TasksPanel({
  selectedProject,
  tasks,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onLoadTasks,
  loading,
  error,
  pagination,
  onUpdateTask,
  formErrors,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("todo");

  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title ?? "");
    setEditDescription(task.description ?? "");
    setEditDueDate(task.due_date ? String(task.due_date).slice(0, 10) : "");
    setEditFormErrors({});
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditFormErrors({});
  };

  const saveEdit = async (taskId) => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || savingTaskId !== null) return;

    setEditFormErrors({});
    setSavingTaskId(taskId);
    try {
      const result = await onUpdateTask(
        taskId,
        {
          title: trimmedTitle,
          description: editDescription.trim() || null,
          due_date: editDueDate || null,
        },
        buildParams(safeCurrentPage),
      );
      if (result?.ok) {
        cancelEdit();
      } else {
        setEditFormErrors(result?.fieldErrors ?? {});
      }
    } finally {
      setSavingTaskId(null);
    }
  };

  const buildParams = (page = 1) => {
    const params = { page };
    if (filterStatus) params.status = filterStatus;
    if (search.trim()) params.search = search.trim();
    return params;
  };

  const safeCurrentPage = Math.min(
    pagination?.currentPage ?? 1,
    pagination?.lastPage ?? 1,
  );

  const submitTask = async (e) => {
    e.preventDefault();
    if (isCreatingTask) return;

    setIsCreatingTask(true);
    try {
      const ok = await onCreateTask(
        {
          title,
          description: description || null,
          due_date: dueDate || null,
          status,
        },
        buildParams(safeCurrentPage),
      );
      if (ok) {
        setTitle("");
        setDescription("");
        setDueDate("");
        setStatus("todo");
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    if (!selectedProject || isFiltering) return;

    setIsFiltering(true);
    try {
      await onLoadTasks(selectedProject.id, buildParams(1));
    } finally {
      setIsFiltering(false);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setDeletingTaskId(taskToDelete.id);
    try {
      await onDeleteTask(taskToDelete.id, buildParams(safeCurrentPage));
      setTaskToDelete(null);
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (!selectedProject) {
    return (
      <section>
        <div className="mb-5">
          <p className="section-label">Task Board</p>
          <h2 className="panel-heading mt-3">Select a project</h2>
          <p className="panel-subheading mt-2">
            Your task workflow appears here once you open a project from the
            left side.
          </p>
        </div>
        <div className="surface-note p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Choose a project to begin.</p>
          <p className="mt-1">
            After you select a project, you can create tasks, update their
            status, search, and paginate through them here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5">
        <p className="section-label">Execution</p>
        <h2 className="panel-heading mt-3">Tasks: {selectedProject.name}</h2>
        <p className="panel-subheading mt-2">
          Add, filter, edit, and review the work inside this project without
          leaving the page.
        </p>
      </div>
      {loading && (
        <p className="mb-2 text-sm text-slate-500">Loading tasks...</p>
      )}
      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submitTask} className="panel-card mb-5 p-5">
        <input
          className="app-input"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isCreatingTask}
          required
        />
        {formErrors?.title?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.title[0]}</p>
        )}
        <textarea
          className="app-textarea mt-3"
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreatingTask}
        />
        {formErrors?.description?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.description[0]}</p>
        )}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input
            type="date"
            className="app-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isCreatingTask}
          />
          {formErrors?.due_date?.[0] && (
            <p className="text-sm text-red-600">{formErrors.due_date[0]}</p>
          )}
          <select
            className="app-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isCreatingTask}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {formErrors?.status?.[0] && (
          <p className="mb-2 text-sm text-red-600">{formErrors.status[0]}</p>
        )}
        <button
          className="btn btn-secondary mt-4 disabled:opacity-60"
          disabled={isCreatingTask}
        >
          {isCreatingTask ? "Adding..." : "Add Task"}
        </button>
      </form>

      <form onSubmit={applyFilters} className="panel-card mb-5 p-5">
        <div className="grid grid-cols-2 gap-2">
          <select
            className="app-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={isFiltering}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="app-input"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isFiltering}
          />
        </div>
        <button
          className="btn btn-dark mt-4 disabled:opacity-60"
          disabled={isFiltering}
        >
          {isFiltering ? "Applying..." : "Apply Filters"}
        </button>
      </form>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="task-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full">
                {editingTaskId === t.id ? (
                  <div className="space-y-2">
                    <input
                      className="app-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title"
                    />
                    {editFormErrors?.title?.[0] && (
                      <p className="text-sm text-red-600">
                        {editFormErrors.title[0]}
                      </p>
                    )}
                    <textarea
                      className="app-textarea"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Task description"
                    />
                    {editFormErrors?.description?.[0] && (
                      <p className="text-sm text-red-600">
                        {editFormErrors.description[0]}
                      </p>
                    )}
                    <input
                      type="date"
                      className="app-input"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                    {editFormErrors?.due_date?.[0] && (
                      <p className="text-sm text-red-600">
                        {editFormErrors.due_date[0]}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(t.id)}
                        className="btn btn-primary px-4 py-2 text-sm disabled:opacity-60"
                        disabled={savingTaskId !== null}
                      >
                        {savingTaskId === t.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn btn-muted px-4 py-2 text-sm disabled:opacity-60"
                        disabled={savingTaskId !== null}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-lg font-semibold text-slate-900">
                      {t.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {t.description}
                    </p>
                    <div className="task-meta-row mt-3">
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                        Due: {formatDueDate(t.due_date)}
                      </span>
                      <span className={STATUS_STYLES[t.status] ?? "status-chip"}>
                        {getStatusLabel(t.status)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="task-actions">
                <select
                  className="app-select max-w-[8.5rem] py-2 text-sm"
                  value={t.status}
                  disabled={
                    statusUpdatingTaskId !== null ||
                    deletingTaskId !== null ||
                    savingTaskId !== null
                  }
                  onChange={async (e) => {
                    setStatusUpdatingTaskId(t.id);
                    try {
                      await onUpdateTaskStatus(
                        t.id,
                        e.target.value,
                        buildParams(safeCurrentPage),
                      );
                    } finally {
                      setStatusUpdatingTaskId(null);
                    }
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {editingTaskId !== t.id && (
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    className="btn btn-warning px-4 py-2 text-sm disabled:opacity-60"
                    disabled={
                      statusUpdatingTaskId !== null ||
                      deletingTaskId !== null ||
                      savingTaskId !== null
                    }
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTaskToDelete(t)}
                  className="btn btn-danger px-4 py-2 text-sm disabled:opacity-60"
                  disabled={
                    statusUpdatingTaskId !== null ||
                    deletingTaskId !== null ||
                    savingTaskId !== null
                  }
                >
                  {deletingTaskId === t.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && tasks.length === 0 && (
        <div className="surface-note mt-4 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-800">
            No tasks found for this project.
          </p>
          <p className="mt-1">
            Add your first task above, or adjust your filters if you expected
            existing tasks to appear.
          </p>
        </div>
      )}
      <div className="panel-card mt-4 flex items-center justify-between px-4 py-3">
        <p className="text-sm text-slate-600">
          Showing {pagination?.from ?? 0}-{pagination?.to ?? 0} of{" "}
          {pagination?.total ?? 0}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-muted px-4 py-2 text-sm disabled:opacity-50"
            disabled={safeCurrentPage <= 1 || isPaginating}
            onClick={async () => {
              setIsPaginating(true);
              try {
                await onLoadTasks(
                  selectedProject.id,
                  buildParams(safeCurrentPage - 1),
                );
              } finally {
                setIsPaginating(false);
              }
            }}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {safeCurrentPage} / {pagination?.lastPage ?? 1}
          </span>
          <button
            type="button"
            className="btn btn-muted px-4 py-2 text-sm disabled:opacity-50"
            disabled={
              safeCurrentPage >= (pagination?.lastPage ?? 1) || isPaginating
            }
            onClick={async () => {
              setIsPaginating(true);
              try {
                await onLoadTasks(
                  selectedProject.id,
                  buildParams(safeCurrentPage + 1),
                );
              } finally {
                setIsPaginating(false);
              }
            }}
          >
            Next
          </button>
        </div>
      </div>

      {taskToDelete && (
        <ConfirmModal
          title="Delete task?"
          message={`This will permanently remove "${taskToDelete.title}".`}
          confirmLabel="Delete task"
          busy={deletingTaskId === taskToDelete.id}
          onCancel={() => {
            if (deletingTaskId === null) setTaskToDelete(null);
          }}
          onConfirm={confirmDeleteTask}
        />
      )}
    </section>
  );
}
