import { useState } from "react";

// University of Ibadan brand colors
const UI_GREEN = "#00472B";
const UI_GREEN_DARK = "#003020";
const UI_GREEN_LIGHT = "#e8f4ee";
const UI_GREEN_MID = "#c2ddd0";
const UI_GOLD = "#C9A84C";
const UI_GOLD_LIGHT = "#fdf6e3";
const UI_GOLD_MID = "#f0d99a";

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Legal"];
const STATUS_OPTIONS = ["Active", "On Leave", "Probation", "Terminated"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const SECTIONS = ["Personal Info", "Contact", "Employment", "Emergency Contact"];

const EMPTY_FORM = {
  firstName: "", lastName: "", dob: "", gender: "", nationality: "",
  email: "", phone: "", address: "", city: "", state: "",
  jobTitle: "", department: "", employmentType: "", startDate: "", status: "Active", employeeId: "",
  emergencyName: "", emergencyRelation: "", emergencyPhone: "",
};

function genId() {
  return "UI-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ── Standalone components (defined OUTSIDE StaffDirectory to prevent remount on every render) ──

function Avatar({ name, size = 36 }) {
  const initials = [name.split(" ")[0]?.[0], name.split(" ")[1]?.[0]]
    .filter(Boolean).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: UI_GREEN,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: UI_GOLD, fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
      letterSpacing: 0.5, border: `2px solid ${UI_GOLD}`,
    }}>{initials || "?"}</div>
  );
}

function Badge({ label }) {
  const colors = {
    Active:     { bg: UI_GREEN_LIGHT, color: UI_GREEN_DARK, border: UI_GREEN_MID },
    "On Leave": { bg: UI_GOLD_LIGHT,  color: "#7a5c10",     border: UI_GOLD_MID  },
    Probation:  { bg: "#eff6ff",      color: "#1e40af",     border: "#bfdbfe"    },
    Terminated: { bg: "#fef2f2",      color: "#991b1b",     border: "#fecaca"    },
  };
  const c = colors[label] || colors.Active;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 20, fontSize: 11, fontWeight: 600, padding: "2px 10px",
      whiteSpace: "nowrap", letterSpacing: 0.3,
    }}>{label}</span>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: UI_GREEN, letterSpacing: 0.3 }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function FormInput({ value, onChange, placeholder, type = "text", hasError }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onFocus={e => { e.target.style.borderColor = UI_GREEN; e.target.style.outline = "none"; }}
      onBlur={e => { e.target.style.borderColor = hasError ? "#dc2626" : ""; }}
      style={{ borderColor: hasError ? "#dc2626" : undefined }}
    />
  );
}

function FormSelect({ value, onChange, options, placeholder, hasError }) {
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={e => { e.target.style.borderColor = UI_GREEN; }}
      onBlur={e => { e.target.style.borderColor = hasError ? "#dc2626" : ""; }}
      style={{ borderColor: hasError ? "#dc2626" : undefined }}
    >
      <option value="">{placeholder || "Select…"}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Main component ──

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM, employeeId: genId() });
  const [activeSection, setActiveSection] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [view, setView] = useState("form");
  const [toast, setToast] = useState(null);
  const [sortField, setSortField] = useState("lastName");

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.jobTitle.trim()) e.jobTitle = "Required";
    if (!form.department) e.department = "Required";
    if (!form.startDate) e.startDate = "Required";
    return e;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const sectionFields = [
        ["firstName", "lastName", "dob", "gender", "nationality"],
        ["email", "phone", "address", "city", "state"],
        ["jobTitle", "department", "employmentType", "startDate", "status"],
        ["emergencyName", "emergencyRelation", "emergencyPhone"],
      ];
      for (let i = 0; i < sectionFields.length; i++) {
        if (sectionFields[i].some(f => errs[f])) { setActiveSection(i); break; }
      }
      return;
    }
    if (editingId) {
      setStaff(s => s.map(m => m.id === editingId ? { ...form, id: editingId } : m));
      setEditingId(null);
      showToast("Staff record updated.");
    } else {
      setStaff(s => [...s, { ...form, id: Date.now() }]);
      showToast("Staff member added.");
    }
    setForm({ ...EMPTY_FORM, employeeId: genId() });
    setActiveSection(0);
    setErrors({});
    setView("directory");
  }

  function handleEdit(member) {
    setForm(member);
    setEditingId(member.id);
    setActiveSection(0);
    setView("form");
    setErrors({});
  }

  function handleDelete(id) {
    setStaff(s => s.filter(m => m.id !== id));
    showToast("Staff record deleted.", "danger");
  }

  function handleCancel() {
    setForm({ ...EMPTY_FORM, employeeId: genId() });
    setEditingId(null);
    setErrors({});
    setActiveSection(0);
    setView("directory");
  }

  function exportCSV() {
    const headers = ["Employee ID","First Name","Last Name","Email","Phone","Department","Job Title","Status","Start Date","Employment Type"];
    const rows = staff.map(s => [
      s.employeeId, s.firstName, s.lastName, s.email, s.phone,
      s.department, s.jobTitle, s.status, s.startDate, s.employmentType,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ""}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "ui_staff_directory.csv";
    a.click();
  }

  const filtered = staff
    .filter(m => {
      const q = search.toLowerCase();
      return !q || [m.firstName, m.lastName, m.email, m.department, m.jobTitle, m.employeeId]
        .some(v => v?.toLowerCase().includes(q));
    })
    .sort((a, b) => (a[sortField] || "").localeCompare(b[sortField] || ""));

  const deptCounts = staff.reduce((acc, m) => {
    acc[m.department] = (acc[m.department] || 0) + 1; return acc;
  }, {});
  const activeCt = staff.filter(m => m.status === "Active").length;

  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
  const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 };
  const primaryBtn = { background: UI_GREEN, color: "#fff", borderColor: UI_GREEN, fontWeight: 500, padding: "8px 18px" };
  const goldBtn    = { background: UI_GOLD, color: UI_GREEN_DARK, borderColor: UI_GOLD, fontWeight: 600, padding: "8px 18px" };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: "24px 16px", background: "#f5f5f5", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: UI_GREEN, borderRadius: 12, padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/en/8/8a/University_of_Ibadan_logo.png"
              alt="University of Ibadan logo"
              style={{ height: 48, width: "auto", objectFit: "contain", flexShrink: 0 }}
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#fff" }}>
              Staff directory
            </h1>
          </div>
          <p style={{ fontSize: 12, color: UI_GOLD_MID, margin: 0 }}>
            University of Ibadan · {staff.length} {staff.length === 1 ? "member" : "members"} · {activeCt} active
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {staff.length > 0 && (
            <button onClick={exportCSV} style={{ ...goldBtn, display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", border: "none", borderRadius: 6 }}>
              ↓ Export CSV
            </button>
          )}
          <button
            onClick={() => setView(view === "form" ? "directory" : "form")}
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", fontSize: 12, padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}>
            {view === "form" ? "View directory" : "+ Add staff"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {staff.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total staff",  value: staff.length },
            { label: "Active",       value: activeCt },
            { label: "Departments",  value: Object.keys(deptCounts).length },
            { label: "Top dept",     value: Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—" },
          ].map(s => (
            <div key={s.label} style={{ background: UI_GREEN_LIGHT, borderRadius: 8, padding: "12px 14px", border: `1px solid ${UI_GREEN_MID}` }}>
              <p style={{ fontSize: 11, color: UI_GREEN, margin: 0, fontWeight: 600, letterSpacing: 0.4 }}>{s.label.toUpperCase()}</p>
              <p style={{ fontSize: 22, fontWeight: 600, margin: "4px 0 0", color: UI_GREEN_DARK }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── FORM VIEW ── */}
      {view === "form" && (
        <div style={{ background: "#fff", border: `1px solid ${UI_GREEN_MID}`, borderRadius: 12, overflow: "hidden" }}>

          {/* Section tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${UI_GREEN_MID}`, background: UI_GREEN_LIGHT }}>
            {SECTIONS.map((s, i) => (
              <button key={s} onClick={() => setActiveSection(i)} style={{
                flex: 1, padding: "11px 8px", fontSize: 12, fontWeight: 500,
                border: "none", borderBottom: activeSection === i ? `2px solid ${UI_GREEN}` : "2px solid transparent",
                background: "transparent", cursor: "pointer",
                color: activeSection === i ? UI_GREEN : "#666",
              }}>{s}</button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* Personal Info */}
            {activeSection === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: UI_GREEN_LIGHT, borderRadius: 8, border: `1px solid ${UI_GREEN_MID}` }}>
                  <Avatar name={`${form.firstName || "?"} ${form.lastName || ""}`} size={48} />
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, color: UI_GREEN_DARK }}>
                      {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}` : "New staff member"}
                    </p>
                    <p style={{ fontSize: 12, color: UI_GREEN, margin: 0, fontWeight: 600 }}>{form.employeeId}</p>
                  </div>
                </div>
                <div style={grid2}>
                  <Field label="First name *" error={errors.firstName}>
                    <FormInput value={form.firstName} onChange={e => setField("firstName", e.target.value)} placeholder="Ada" hasError={!!errors.firstName} />
                  </Field>
                  <Field label="Last name *" error={errors.lastName}>
                    <FormInput value={form.lastName} onChange={e => setField("lastName", e.target.value)} placeholder="Okafor" hasError={!!errors.lastName} />
                  </Field>
                </div>
                <div style={grid3}>
                  <Field label="Date of birth">
                    <FormInput value={form.dob} onChange={e => setField("dob", e.target.value)} type="date" />
                  </Field>
                  <Field label="Gender">
                    <FormSelect value={form.gender} onChange={e => setField("gender", e.target.value)} options={["Male","Female","Non-binary","Prefer not to say"]} />
                  </Field>
                  <Field label="Nationality">
                    <FormInput value={form.nationality} onChange={e => setField("nationality", e.target.value)} placeholder="Nigerian" />
                  </Field>
                </div>
              </div>
            )}

            {/* Contact */}
            {activeSection === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={grid2}>
                  <Field label="Email address *" error={errors.email}>
                    <FormInput value={form.email} onChange={e => setField("email", e.target.value)} type="email" placeholder="ada@ui.edu.ng" hasError={!!errors.email} />
                  </Field>
                  <Field label="Phone number *" error={errors.phone}>
                    <FormInput value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="+234 800 000 0000" hasError={!!errors.phone} />
                  </Field>
                </div>
                <Field label="Street address">
                  <FormInput value={form.address} onChange={e => setField("address", e.target.value)} placeholder="University of Ibadan, Ibadan" />
                </Field>
                <div style={grid2}>
                  <Field label="City">
                    <FormInput value={form.city} onChange={e => setField("city", e.target.value)} placeholder="Ibadan" />
                  </Field>
                  <Field label="State / Region">
                    <FormInput value={form.state} onChange={e => setField("state", e.target.value)} placeholder="Oyo State" />
                  </Field>
                </div>
              </div>
            )}

            {/* Employment */}
            {activeSection === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={grid2}>
                  <Field label="Job title *" error={errors.jobTitle}>
                    <FormInput value={form.jobTitle} onChange={e => setField("jobTitle", e.target.value)} placeholder="Senior Lecturer" hasError={!!errors.jobTitle} />
                  </Field>
                  <Field label="Department *" error={errors.department}>
                    <FormSelect value={form.department} onChange={e => setField("department", e.target.value)} options={DEPARTMENTS} hasError={!!errors.department} />
                  </Field>
                </div>
                <div style={grid3}>
                  <Field label="Employment type">
                    <FormSelect value={form.employmentType} onChange={e => setField("employmentType", e.target.value)} options={EMPLOYMENT_TYPES} />
                  </Field>
                  <Field label="Start date *" error={errors.startDate}>
                    <FormInput value={form.startDate} onChange={e => setField("startDate", e.target.value)} type="date" hasError={!!errors.startDate} />
                  </Field>
                  <Field label="Status">
                    <FormSelect value={form.status} onChange={e => setField("status", e.target.value)} options={STATUS_OPTIONS} />
                  </Field>
                </div>
                <Field label="Employee ID">
                  <div style={{ display: "flex", gap: 8 }}>
                    <FormInput value={form.employeeId} onChange={e => setField("employeeId", e.target.value)} placeholder="UI-XXXXX" />
                    <button onClick={() => setField("employeeId", genId())}
                      style={{ padding: "0 14px", flexShrink: 0, border: `1px solid ${UI_GREEN_MID}`, borderRadius: 6, background: "#fff", cursor: "pointer", color: UI_GREEN }}>
                      ↺
                    </button>
                  </div>
                </Field>
              </div>
            )}

            {/* Emergency */}
            {activeSection === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Provide an emergency contact for this staff member.</p>
                <div style={grid2}>
                  <Field label="Contact name">
                    <FormInput value={form.emergencyName} onChange={e => setField("emergencyName", e.target.value)} placeholder="Emeka Okafor" />
                  </Field>
                  <Field label="Relationship">
                    <FormInput value={form.emergencyRelation} onChange={e => setField("emergencyRelation", e.target.value)} placeholder="Spouse" />
                  </Field>
                </div>
                <Field label="Phone number">
                  <FormInput value={form.emergencyPhone} onChange={e => setField("emergencyPhone", e.target.value)} placeholder="+234 800 000 0001" />
                </Field>
              </div>
            )}
          </div>

          {/* Form footer */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", borderTop: `1px solid ${UI_GREEN_MID}`, background: UI_GREEN_LIGHT }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCancel} style={{ padding: "8px 16px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#555" }}>Cancel</button>
              {activeSection > 0 && (
                <button onClick={() => setActiveSection(a => a - 1)} style={{ padding: "8px 16px", border: `1px solid ${UI_GREEN_MID}`, borderRadius: 6, background: "#fff", cursor: "pointer", color: UI_GREEN }}>← Previous</button>
              )}
            </div>
            <div>
              {activeSection < 3 ? (
                <button onClick={() => setActiveSection(a => a + 1)} style={{ ...primaryBtn, border: "none", borderRadius: 6, cursor: "pointer" }}>Next →</button>
              ) : (
                <button onClick={handleSubmit} style={{ ...goldBtn, border: "none", borderRadius: 6, cursor: "pointer" }}>
                  {editingId ? "Save changes" : "Add to directory"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DIRECTORY VIEW ── */}
      {view === "directory" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, department, email…"
              style={{ flex: 1, padding: "8px 14px", border: `1px solid ${UI_GREEN_MID}`, borderRadius: 6, fontSize: 13, outline: "none" }}
              onFocus={e => { e.target.style.borderColor = UI_GREEN; }}
              onBlur={e => { e.target.style.borderColor = UI_GREEN_MID; }}
            />
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              style={{ padding: "8px 12px", border: `1px solid ${UI_GREEN_MID}`, borderRadius: 6, fontSize: 13, background: "#fff", color: "#333" }}>
              <option value="lastName">Sort: Last name</option>
              <option value="department">Sort: Department</option>
              <option value="startDate">Sort: Start date</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0", background: UI_GREEN_LIGHT, borderRadius: 12, border: `1px solid ${UI_GREEN_MID}` }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px", color: UI_GREEN_DARK, fontSize: 16 }}>
                {staff.length === 0 ? "No staff yet" : "No results"}
              </p>
              <p style={{ fontSize: 13, margin: 0, color: "#666" }}>
                {staff.length === 0 ? "Add your first staff member to get started." : "Try a different search term."}
              </p>
              {staff.length === 0 && (
                <button onClick={() => setView("form")} style={{ ...primaryBtn, marginTop: 16, border: "none", borderRadius: 6, cursor: "pointer" }}>
                  Add first staff member
                </button>
              )}
            </div>
          ) : (
            <div style={{ border: `1px solid ${UI_GREEN_MID}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: UI_GREEN }}>
                      {["Staff member","Department","Job title","Status","Start date","Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: UI_GOLD, fontSize: 11, letterSpacing: 0.5, borderBottom: `1px solid ${UI_GREEN_DARK}` }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, idx) => (
                      <tr key={m.id} style={{ background: idx % 2 === 0 ? "#fff" : UI_GREEN_LIGHT, fontSize: 13 }}>
                        <td style={{ padding: "12px 14px", borderBottom: `1px solid ${UI_GREEN_MID}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={`${m.firstName} ${m.lastName}`} size={32} />
                            <div>
                              <p style={{ fontWeight: 600, margin: 0, color: UI_GREEN_DARK }}>{m.firstName} {m.lastName}</p>
                              <p style={{ fontSize: 11, color: UI_GREEN, margin: 0 }}>{m.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: `1px solid ${UI_GREEN_MID}`, color: "#555" }}>{m.department || "—"}</td>
                        <td style={{ padding: "12px 14px", borderBottom: `1px solid ${UI_GREEN_MID}`, color: UI_GREEN_DARK }}>{m.jobTitle}</td>
                        <td style={{ padding: "12px 14px", borderBottom: `1px solid ${UI_GREEN_MID}` }}><Badge label={m.status || "Active"} /></td>
                        <td style={{ padding: "12px 14px", borderBottom: `1px solid ${UI_GREEN_MID}`, color: "#555" }}>
                          {m.startDate ? new Date(m.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: `1px solid ${UI_GREEN_MID}` }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleEdit(m)} style={{ padding: "4px 10px", border: `1px solid ${UI_GREEN_MID}`, borderRadius: 5, background: "#fff", color: UI_GREEN, cursor: "pointer", fontSize: 12 }}>Edit</button>
                            <button onClick={() => handleDelete(m.id)} style={{ padding: "4px 10px", border: "1px solid #fecaca", borderRadius: 5, background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "10px 14px", fontSize: 12, color: UI_GREEN, background: UI_GREEN_LIGHT, borderTop: `1px solid ${UI_GREEN_MID}`, fontWeight: 500 }}>
                Showing {filtered.length} of {staff.length} staff members
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: toast.type === "danger" ? "#fef2f2" : UI_GREEN_LIGHT,
          color: toast.type === "danger" ? "#991b1b" : UI_GREEN_DARK,
          border: `1px solid ${toast.type === "danger" ? "#fecaca" : UI_GREEN_MID}`,
          padding: "12px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.type === "danger" ? "🗑" : "✓"} {toast.msg}
        </div>
      )}
    </div>
  );
}
