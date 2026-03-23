import { useEffect, useRef, useState } from "react";
import api, { setUnauthorizedHandler } from "./lib/api";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ProjectsPanel from "./components/ProjectsPanel";
import TasksPanel from "./components/TasksPanel";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authFormErrors, setAuthFormErrors] = useState({});
  const [authLoading, setAuthLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [projectFormErrors, setProjectFormErrors] = useState({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [toast, setToast] = useState({ message: "", type: "success" });
  const toastTimeoutRef = useRef(null);
  const [taskPagination, setTaskPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      showToast("Session expired. Please log in again.", "error");
      setToken(null);
      setCurrentUser(null);
      setAuthMode("login");
      setAuthFormErrors({});
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      setTaskPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0,
      });
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message, type = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: "", type: "success" });
      toastTimeoutRef.current = null;
    }, 2400);
  };

  const getFieldErrors = (err) => {
    if (err?.response?.status === 422) {
      return err?.response?.data?.errors ?? {};
    }

    return {};
  };

  useEffect(() => {
    if (token) {
      loadCurrentUser();
      loadProjects();
    }
  }, [token]);

  const loadCurrentUser = async () => {
    try {
      const res = await api.get("/me");
      setCurrentUser(res.data ?? null);
    } catch {
      setCurrentUser(null);
    }
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError("");
    try {
      const res = await api.get("/projects");
      setProjects(res.data.data ?? []);
    } catch (err) {
      setProjectsError(
        err?.response?.data?.message || "Failed to load projects.",
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadTasks = async (projectId, params = {}) => {
    setTasksLoading(true);
    setTasksError("");
    try {
      const res = await api.get(`/projects/${projectId}/tasks`, { params });
      const payload = res.data ?? {};
      const current = payload.current_page ?? 1;
      const last = Math.max(payload.last_page ?? 1, 1);
      setTasks(payload.data ?? []);
      setTaskPagination({
        currentPage: Math.min(current, last),
        lastPage: last,
        total: payload.total ?? 0,
        from: payload.from ?? 0,
        to: payload.to ?? 0,
      });
    } catch (err) {
      setTasksError(err?.response?.data?.message || "Failed to load tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setAuthFormErrors({});
    setAuthLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user ?? null);
      showToast("Logged in.");
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        "Failed to sign in. Check the API URL and CORS settings.";
      showToast(message, "error");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (payload) => {
    setAuthFormErrors({});
    setAuthLoading(true);
    try {
      const res = await api.post("/register", payload);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user ?? null);
      setAuthMode("login");
      showToast("Account created.");
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to create account.";
      setAuthFormErrors(getFieldErrors(err));
      showToast(message, "error");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setCurrentUser(null);
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      setTaskPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0,
      });
    }
  };

  const createProject = async ({ name, description }) => {
    setProjectsError("");
    setProjectFormErrors({});
    try {
      await api.post("/projects", { name, description });
      await loadProjects();
      showToast("Project created.");
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create project.";
      setProjectsError(message);
      setProjectFormErrors(getFieldErrors(err));
      showToast(message, "error");
      return false;
    }
  };

  const updateProject = async (projectId, payload) => {
    setProjectsError("");
    try {
      await api.put(`/projects/${projectId}`, payload);
      await loadProjects();

      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, ...payload } : prev));
      }
      showToast("Project updated.");
      return { ok: true, fieldErrors: {} };
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update project.";
      setProjectsError(message);
      showToast(message, "error");
      return { ok: false, fieldErrors: getFieldErrors(err) };
    }
  };

  const deleteProject = async (projectId) => {
    setProjectsError("");
    try {
      await api.delete(`/projects/${projectId}`);
      await loadProjects();

      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setTasks([]);
        setTaskPagination({
          currentPage: 1,
          lastPage: 1,
          total: 0,
          from: 0,
          to: 0,
        });
      }
      showToast("Project deleted.");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete project.";
      setProjectsError(message);
      showToast(message, "error");
    }
  };

  const selectProject = async (project) => {
    setSelectedProject(project);
    setTaskPagination({
      currentPage: 1,
      lastPage: 1,
      total: 0,
      from: 0,
      to: 0,
    });
    await loadTasks(project.id, { page: 1 });
  };

  const createTask = async (payload, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    setTaskFormErrors({});
    try {
      await api.post(`/projects/${selectedProject.id}/tasks`, payload);
      await loadTasks(selectedProject.id, params);
      showToast("Task created.");
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create task.";
      setTasksError(message);
      setTaskFormErrors(getFieldErrors(err));
      showToast(message, "error");
      return false;
    }
  };

  const updateTask = async (taskId, payload, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    try {
      await api.put(`/projects/${selectedProject.id}/tasks/${taskId}`, payload);
      await loadTasks(selectedProject.id, params);
      showToast("Task updated.");
      return { ok: true, fieldErrors: {} };
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update task.";
      setTasksError(message);
      showToast(message, "error");
      return { ok: false, fieldErrors: getFieldErrors(err) };
    }
  };

  const updateTaskStatus = async (taskId, status, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    try {
      await api.put(`/projects/${selectedProject.id}/tasks/${taskId}`, {
        status,
      });
      await loadTasks(selectedProject.id, params);
      showToast("Task status updated.");
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to update task status.";
      setTasksError(message);
      showToast(message, "error");
    }
  };

  const deleteTask = async (taskId, params = {}) => {
    if (!selectedProject) return;
    setTasksError("");
    try {
      await api.delete(`/projects/${selectedProject.id}/tasks/${taskId}`);
      await loadTasks(selectedProject.id, params);
      showToast("Task deleted.");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete task.";
      setTasksError(message);
      showToast(message, "error");
    }
  };

  const toastNode = toast.message ? (
    <div className="fixed right-4 top-4 z-50">
      <div
        className={`toast-card text-sm font-medium text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}
      >
        {toast.message}
      </div>
    </div>
  ) : null;

  if (!token) {
    return (
      <>
        {toastNode}
        {authMode === "login" ? (
          <LoginForm
            onLogin={login}
            loading={authLoading}
            onSwitchToRegister={() => {
              if (authLoading) return;
              setAuthFormErrors({});
              setAuthMode("register");
            }}
          />
        ) : (
          <RegisterForm
            onRegister={register}
            loading={authLoading}
            formErrors={authFormErrors}
            onSwitchToLogin={() => {
              if (authLoading) return;
              setAuthFormErrors({});
              setAuthMode("login");
            }}
          />
        )}
      </>
    );
  }

  return (
    <main className="app-page">
      {toastNode}
      <div className="app-shell">
        <section className="hero-card px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <span className="section-label">Workspace</span>
              <h1 className="hero-title mt-4">Smart Task Manager</h1>
              <p className="hero-copy mt-4">
                Keep projects, tasks, and status updates in one calm workspace.
                Built for quick planning, cleaner handoffs, and less friction
                when you just need to get work moving.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-[16rem] lg:items-end">
              <div className="stat-pill text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Signed in
                </p>
                <p className="mt-2 text-base font-semibold text-slate-800">
                  {currentUser?.name || currentUser?.email || "Authenticated"}
                </p>
              </div>
              <div className="stat-pill text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Projects
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-5">
            <p className="text-sm text-slate-500">
              Organize work, assign momentum, and keep progress visible.
            </p>

            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="stat-pill px-4 py-3 text-sm text-slate-700">
                  Signed in as{" "}
                  <span className="font-semibold text-slate-900">
                    {currentUser.name || currentUser.email}
                  </span>
                </div>
              )}
              <button onClick={logout} className="btn btn-dark">
                Logout
              </button>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.02fr_1fr]">
          <div className="panel-card p-5 md:p-6">
            <ProjectsPanel
              projects={projects}
              selectedProject={selectedProject}
              onCreateProject={createProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onSelectProject={selectProject}
              loading={projectsLoading}
              error={projectsError}
              formErrors={projectFormErrors}
            />
          </div>

          <div className="panel-card p-5 md:p-6">
            <TasksPanel
              selectedProject={selectedProject}
              tasks={tasks}
              onCreateTask={createTask}
              onUpdateTaskStatus={updateTaskStatus}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onLoadTasks={loadTasks}
              loading={tasksLoading}
              error={tasksError}
              pagination={taskPagination}
              formErrors={taskFormErrors}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
