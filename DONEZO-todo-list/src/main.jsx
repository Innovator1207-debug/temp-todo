import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus, Search, Moon, Sun, Check, Trash2, Pencil, X,
  CalendarDays, Flag, ListTodo, CircleCheck, Clock3
} from "lucide-react";
import "./styles.css";

const starterTasks = [
  {
    id: crypto.randomUUID(),
    title: "Complete DSA practice",
    description: "Solve 5 problems today.",
    priority: "High",
    dueDate: new Date().toISOString().slice(0, 10),
    completed: false,
    createdAt: Date.now()
  },
  {
    id: crypto.randomUUID(),
    title: "Read for 30 minutes",
    description: "Study something useful before bed.",
    priority: "Medium",
    dueDate: "",
    completed: false,
    createdAt: Date.now() - 1000
  }
];

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("donezo_tasks");
    return saved ? JSON.parse(saved) : starterTasks;
  });
  const [dark, setDark] = useState(() => localStorage.getItem("donezo_theme") !== "light");
  const [filter, setFilter] = useState("All");
  const [priority, setPriority] = useState("All");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    localStorage.setItem("donezo_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("donezo_theme", dark ? "dark" : "light");
  }, [dark]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length
  }), [tasks]);

  const progress = stats.total ? Math.round(stats.completed / stats.total * 100) : 0;

  const filteredTasks = useMemo(() => tasks.filter(task => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Active" && !task.completed) ||
      (filter === "Completed" && task.completed);
    const matchesPriority = priority === "All" || task.priority === priority;
    const matchesSearch =
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesPriority && matchesSearch;
  }), [tasks, filter, priority, query]);

  function saveTask(data) {
    if (editing) {
      setTasks(prev => prev.map(t => t.id === editing.id ? { ...t, ...data } : t));
    } else {
      setTasks(prev => [{ ...data, id: crypto.randomUUID(), completed: false, createdAt: Date.now() }, ...prev]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function startEdit(task) {
    setEditing(task);
    setShowForm(true);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><ListTodo size={21}/></div>
          <div>
            <div className="brand-name">DONEZO</div>
            <div className="brand-sub">Get things done.</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setDark(v => !v)} aria-label="Toggle theme">
          {dark ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
            <h1>Today's tasks<span>.</span></h1>
            <p className="hero-copy">Focus on what matters and keep your momentum.</p>
          </div>
          <button className="add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={19}/> Add task
          </button>
        </section>

        <section className="stats-grid">
          <Stat icon={<ListTodo/>} label="Total" value={stats.total}/>
          <Stat icon={<Clock3/>} label="Pending" value={stats.pending}/>
          <Stat icon={<CircleCheck/>} label="Completed" value={stats.completed}/>
          <div className="progress-card">
            <div className="progress-head"><span>Today's progress</span><strong>{progress}%</strong></div>
            <div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}}/></div>
          </div>
        </section>

        <section className="toolbar">
          <div className="search">
            <Search size={18}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks..." />
            {query && <button onClick={() => setQuery("")}><X size={15}/></button>}
          </div>
          <div className="filters">
            {["All", "Active", "Completed"].map(x =>
              <button key={x} className={filter === x ? "filter active" : "filter"} onClick={() => setFilter(x)}>{x}</button>
            )}
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="All">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </section>

        <section className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><ListTodo size={28}/></div>
              <h3>No tasks found</h3>
              <p>Add a task or change your filters.</p>
            </div>
          ) : filteredTasks.map(task =>
            <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={startEdit} onDelete={deleteTask}/>
          )}
        </section>
      </main>

      {showForm && (
        <TaskModal task={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={saveTask}/>
      )}
    </div>
  );
}

function Stat({icon, label, value}) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div></div>;
}

function TaskCard({task, onToggle, onEdit, onDelete}) {
  const overdue = task.dueDate && !task.completed && task.dueDate < new Date().toISOString().slice(0,10);
  return (
    <article className={`task-card ${task.completed ? "done" : ""}`}>
      <button className={`check ${task.completed ? "checked" : ""}`} onClick={() => onToggle(task.id)}>
        {task.completed && <Check size={17}/>}
      </button>
      <div className="task-content">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className={`priority ${task.priority.toLowerCase()}`}><Flag size={12}/>{task.priority}</span>
        </div>
        {task.description && <p>{task.description}</p>}
        {task.dueDate && <div className={`due ${overdue ? "overdue" : ""}`}><CalendarDays size={14}/>{overdue ? "Overdue · " : "Due · "}{new Date(task.dueDate + "T00:00:00").toLocaleDateString(undefined, {month:"short", day:"numeric"})}</div>}
      </div>
      <div className="task-actions">
        <button onClick={() => onEdit(task)} aria-label="Edit"><Pencil size={17}/></button>
        <button onClick={() => onDelete(task.id)} aria-label="Delete"><Trash2 size={17}/></button>
      </div>
    </article>
  );
}

function TaskModal({task, onClose, onSave}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({title: title.trim(), description: description.trim(), priority, dueDate});
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head"><div><p className="eyebrow">{task ? "EDIT TASK" : "NEW TASK"}</p><h2>{task ? "Update task" : "Create a task"}</h2></div><button type="button" className="icon-btn" onClick={onClose}><X/></button></div>
        <label>Task title<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finish DSA assignment"/></label>
        <label>Description <span>optional</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a little context..."/></label>
        <div className="form-row">
          <label>Priority<select value={priority} onChange={e => setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Due date <span>optional</span><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/></label>
        </div>
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="add-btn" type="submit">{task ? "Save changes" : "Create task"}</button></div>
      </form>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
