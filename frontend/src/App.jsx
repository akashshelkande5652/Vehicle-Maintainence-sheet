import React, { useEffect, useMemo, useState } from "react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- Configure your backend base URL here ---
// If your Go server runs on http://localhost:8080 keep as-is.
//const BASE_URL = "http://localhost:8080";

// Small helper for fetch with error handling
async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  // Try to parse JSON; fall back to raw text
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

function Section({ title, children, actions }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text", placeholder, required=false }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        className="px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring focus:ring-indigo-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function NumberInput(props) {
  return <TextInput type="number" step="any" {...props} />;
}

function Button({ children, onClick, type = "button", variant = "primary", disabled }) {
  const base = "px-4 py-2 rounded-xl font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    ghost: "bg-transparent text-indigo-700 hover:bg-indigo-50",
    outline: "bg-white border border-gray-300 hover:bg-gray-50",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Table({ columns, data, emptyLabel = "No data" }) {
  return (
    <div className="overflow-auto border border-gray-200 rounded-xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [vehicleDetail, setVehicleDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const [maintRecs, setMaintRecs] = useState([]);
  const [maintLoading, setMaintLoading] = useState(false);
  const [maintError, setMaintError] = useState("");

  const [vidForPair, setVidForPair] = useState("");
  const [sidForPair, setSidForPair] = useState("");
  const [pairRecs, setPairRecs] = useState([]);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState("");

  // Add maintenance form state
  const [form, setForm] = useState({
    vid: "",
    sid: "",
    service_date: "",
    part_code: "",
    rate: "",
    taxable_amount: "",
    final_amount: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createErr, setCreateErr] = useState("");

  // Load all vehicles
  const loadVehicles = async () => {
    setLoadingVehicles(true);
    setVehicleError("");
    try {
      const data = await api("/vehicles");
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      setVehicleError(e.message);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const vehicleColumns = useMemo(() => [
    { key: "id", title: "ID" },
    { key: "make", title: "Make" },
    { key: "model", title: "Model" },
    { key: "year", title: "Year" },
    { key: "mileage", title: "Mileage" },
  ], []);

  const maintColumns = useMemo(() => [
    { key: "service_id", title: "Service ID" },
    { key: "vehicle_id", title: "Vehicle ID" },
    { key: "service_date", title: "Service Date" },
    { key: "part_code", title: "Part Code" },
    { key: "rate", title: "Rate" },
    { key: "taxable_amount", title: "Taxable" },
    { key: "final_amount", title: "Final" },
  ], []);

  const fetchVehicleDetail = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    setDetailError("");
    setVehicleDetail(null);
    try {
      const data = await api(`/vehicle/${encodeURIComponent(selectedId)}`);
      setVehicleDetail(data);
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchVehicleMaintenance = async () => {
    if (!selectedId) return;
    setMaintLoading(true);
    setMaintError("");
    setMaintRecs([]);
    try {
      const data = await api(`/vehicle/${encodeURIComponent(selectedId)}/viewmaintenance`);
      setMaintRecs(Array.isArray(data) ? data : []);
    } catch (e) {
      setMaintError(e.message);
    } finally {
      setMaintLoading(false);
    }
  };

  const fetchPairMaintenance = async () => {
    if (!vidForPair || !sidForPair) return;
    setPairLoading(true);
    setPairError("");
    setPairRecs([]);
    try {
      const data = await api(`/vehicle/${encodeURIComponent(vidForPair)}/${encodeURIComponent(sidForPair)}/viewmaintenancebyvidsid`);
      setPairRecs(Array.isArray(data) ? data : []);
    } catch (e) {
      setPairError(e.message);
    } finally {
      setPairLoading(false);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setCreateMsg("");
    setCreateErr("");

    // Basic validation
    if (!form.vid || !form.sid) {
      setCreateErr("Vehicle ID and Service ID are required.");
      return;
    }

    const payload = {
      service_date: form.service_date,
      part_code: form.part_code,
      rate: parseFloat(form.rate || 0),
      taxable_amount: parseFloat(form.taxable_amount || 0),
      final_amount: parseFloat(form.final_amount || 0),
    };

    setCreateLoading(true);
    try {
      const data = await api(`/vehicle/${encodeURIComponent(form.vid)}/${encodeURIComponent(form.sid)}/addmaintenance`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCreateMsg(data?.message || "Record inserted successfully");
      // Optionally refresh lists if matching vehicle selected
      if (selectedId && String(selectedId) === String(form.vid)) {
        fetchVehicleMaintenance();
      }
    } catch (e) {
      setCreateErr(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="w-full p-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Bike Maintenance Dashboard</h1>
          <div className="text-xs text-gray-500">Backend: {BASE_URL}</div>
        </div>
      </header>

        <main className="w-full p-4 grid lg:grid-cols-3 gap-6">
        {/* Vehicles list */}
        <div className="lg:col-span-2 space-y-6">
          <Section
            title="Owned Vehicles"
            actions={<Button variant="ghost" onClick={loadVehicles} disabled={loadingVehicles}>Refresh</Button>}
          >
            {vehicleError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{vehicleError}</div>
            )}
            {loadingVehicles ? (
              <div className="p-6 text-gray-500">Loading vehicles…</div>
            ) : (
              <Table columns={vehicleColumns} data={vehicles} emptyLabel="No vehicles found" />
            )}
          </Section>

          <Section title="Maintenance by Vehicle">
            <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end mb-4">
              <TextInput label="Vehicle ID" value={selectedId} onChange={setSelectedId} placeholder="e.g. 1" />
              <Button onClick={fetchVehicleDetail} disabled={!selectedId || detailLoading}>Get Vehicle</Button>
              <Button variant="outline" onClick={fetchVehicleMaintenance} disabled={!selectedId || maintLoading}>View Maintenance</Button>
            </div>

            {detailError && <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{detailError}</div>}
            {vehicleDetail && (
              <div className="mb-4 grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Make</div>
                  <div className="font-medium">{vehicleDetail.make}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Model</div>
                  <div className="font-medium">{vehicleDetail.model}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Year</div>
                  <div className="font-medium">{vehicleDetail.year}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500">Mileage</div>
                  <div className="font-medium">{vehicleDetail.mileage}</div>
                </div>
              </div>
            )}

            {maintError && <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{maintError}</div>}
            {maintLoading ? (
              <div className="p-6 text-gray-500">Loading maintenance…</div>
            ) : (
              <Table columns={maintColumns} data={maintRecs} emptyLabel="No maintenance records" />
            )}
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Find Maintenance by Vehicle + Service ID">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Vehicle ID" value={vidForPair} onChange={setVidForPair} placeholder="e.g. 1" />
              <TextInput label="Service ID" value={sidForPair} onChange={setSidForPair} placeholder="e.g. 101" />
            </div>
            <div className="mt-3">
              <Button onClick={fetchPairMaintenance} disabled={!vidForPair || !sidForPair || pairLoading}>Search</Button>
            </div>
            {pairError && <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{pairError}</div>}
            {pairLoading ? (
              <div className="p-6 text-gray-500">Searching…</div>
            ) : (
              <div className="mt-4">
                <Table columns={maintColumns} data={pairRecs} emptyLabel="No records for the given pair" />
              </div>
            )}
          </Section>

          <Section title="Add Maintenance Record">
            <form onSubmit={submitCreate} className="grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <TextInput label="Vehicle ID (vid)" value={form.vid} onChange={(v)=>setForm(f=>({ ...f, vid: v }))} required placeholder="e.g. 1" />
                <TextInput label="Service ID (sid)" value={form.sid} onChange={(v)=>setForm(f=>({ ...f, sid: v }))} required placeholder="e.g. 101" />
              </div>
              <TextInput label="Service Date" value={form.service_date} onChange={(v)=>setForm(f=>({ ...f, service_date: v }))} placeholder="YYYY-MM-DD" />
              <TextInput label="Part Code" value={form.part_code} onChange={(v)=>setForm(f=>({ ...f, part_code: v }))} placeholder="e.g. OIL-FLTR" />
              <div className="grid sm:grid-cols-3 gap-3">
                <NumberInput label="Rate" value={form.rate} onChange={(v)=>setForm(f=>({ ...f, rate: v }))} placeholder="0" />
                <NumberInput label="Taxable Amount" value={form.taxable_amount} onChange={(v)=>setForm(f=>({ ...f, taxable_amount: v }))} placeholder="0" />
                <NumberInput label="Final Amount" value={form.final_amount} onChange={(v)=>setForm(f=>({ ...f, final_amount: v }))} placeholder="0" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Button type="submit" disabled={createLoading}>Add Record</Button>
                {createLoading && <span className="text-sm text-gray-500">Submitting…</span>}
              </div>
            </form>
            {createMsg && <div className="mt-3 p-3 rounded-xl bg-green-50 text-green-700 text-sm">{createMsg}</div>}
            {createErr && <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{createErr}</div>}
          </Section>

          <Section title="Tips" >
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>Ensure your Go server is running on <code>http://localhost:8080</code>.</li>
              <li>If you host this frontend on a different origin/port, enable CORS in your Go server or use the same origin.</li>
              <li>Date is sent as plain text; match your DB format (e.g., <code>YYYY-MM-DD</code>).</li>
              <li>Numeric fields are sent as numbers; empty fields default to 0.</li>
            </ul>
          </Section>
        </div>
      </main>

      <footer className="w-full p-6 text-xs text-gray-500">
        Built for your existing endpoints:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>GET /vehicles</li>
          <li>GET /vehicle/{`{id}`}</li>
          <li>GET /vehicle/{`{id}`}/viewmaintenance</li>
          <li>GET /vehicle/{`{vid}`}/{`{sid}`}/viewmaintenancebyvidsid</li>
          <li>POST /vehicle/{`{vid}`}/{`{sid}`}/addmaintenance</li>
        </ul>
      </footer>
    </div>
  );
}
