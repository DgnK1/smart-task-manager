import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

export default function ProjectsPanel({
  projects,
  selectedProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  loading,
  error,
  formErrors,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFormErrors, setEditFormErrors] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const ok = await onCreateProject({ name, description });
      if (ok) {
        setName("");
        setDescription("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (project) => {
    if (editingId !== null || deletingId !== null || savingId !== null) return;
    setEditingId(project.id);
    setEditName(project.name ?? "");
    setEditDescription(project.description ?? "");
    setEditFormErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditFormErrors({});
  };

  const saveEdit = async (project) => {
    const trimmedName = editName.trim();
    if (!trimmedName || savingId !== null) {
      if (!trimmedName) {
        setEditFormErrors({ name: ["The project name field is required."] });
      }
      return;
    }

    setEditFormErrors({});
    setSavingId(project.id);
    try {
      const result = await onUpdateProject(project.id, {
        name: trimmedName,
        description: editDescription.trim(),
      });

      if (result?.ok) {
        cancelEdit();
      } else {
        setEditFormErrors(result?.fieldErrors ?? {});
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (project) => {
    if (editingId !== null || deletingId !== null) return;
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeletingId(projectToDelete.id);
    try {
      await onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="mb-5">
        <p className="section-label">Portfolio</p>
        <h2 className="panel-heading mt-3">Projects</h2>
        <p className="panel-subheading mt-2">
          Capture the workspaces you are actively planning and jump into one
          with a single click.
        </p>
      </div>

      {loading && (
        <p className="mb-2 text-sm text-slate-500">Loading projects...</p>
      )}
      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="panel-card mb-5 p-5">
        <input
          className="app-input"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
          required
        />
        {formErrors?.name?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.name[0]}</p>
        )}
        <textarea
          className="app-textarea mt-3"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating}
        />
        {formErrors?.description?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.description[0]}</p>
        )}
        <button
          className="btn btn-primary mt-4 disabled:opacity-60"
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create Project"}
        </button>
      </form>

      <div className="space-y-3">
        {projects.map((p) => {
          const isRowBusy =
            editingId === p.id || deletingId === p.id || savingId === p.id;
          const isAnyProjectActionBusy =
            editingId !== null ||
            deletingId !== null ||
            savingId !== null ||
            isCreating;

          return (
            <div
              key={p.id}
              className={`project-card p-5 ${
                selectedProject?.id === p.id
                  ? "project-card-active"
                  : ""
              }`}
            >
              {editingId === p.id ? (
                <div className="space-y-2">
                  <input
                    className="app-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Project name"
                    disabled={savingId !== null}
                  />
                  {editFormErrors?.name?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.name[0]}
                    </p>
                  )}

                  <textarea
                    className="app-textarea"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Project description"
                    disabled={savingId !== null}
                  />
                  {editFormErrors?.description?.[0] && (
                    <p className="text-sm text-red-600">
                      {editFormErrors.description[0]}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(p)}
                      className="btn btn-primary px-4 py-2 text-sm disabled:opacity-60"
                      disabled={savingId !== null}
                    >
                      {savingId === p.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-muted px-4 py-2 text-sm disabled:opacity-60"
                      disabled={savingId !== null}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectProject(p)}
                    className="mb-3 w-full text-left"
                    disabled={isRowBusy}
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {p.description}
                    </p>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(p);
                      }}
                      className="btn btn-warning px-4 py-2 text-sm disabled:opacity-60"
                      disabled={isAnyProjectActionBusy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p);
                      }}
                      className="btn btn-danger px-4 py-2 text-sm disabled:opacity-60"
                      disabled={isAnyProjectActionBusy}
                    >
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!loading && projects.length === 0 && (
        <div className="surface-note mt-4 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No projects yet.</p>
          <p className="mt-1">
            Create your first project using the form above to start organizing
            tasks.
          </p>
        </div>
      )}

      {projectToDelete && (
        <ConfirmModal
          title="Delete project?"
          message={`This will permanently remove "${projectToDelete.name}" and its tasks.`}
          confirmLabel="Delete project"
          busy={deletingId === projectToDelete.id}
          onCancel={() => {
            if (deletingId === null) setProjectToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}
