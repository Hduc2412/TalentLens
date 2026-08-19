import React, { useState, useCallback, useRef, useMemo } from "react";
import { Search, Command, ChevronDown, Undo2, Redo2, Save, GitCommit, LayoutGrid, Boxes, Lock, Send, ShieldCheck, Eye } from "lucide-react";

const tokens = {
  canvas: "#f7f8fa",
  indigo: "#1f4fd8",
  cyan: "#17b6d8",
  gradient: "linear-gradient(90deg, #1f4fd8 0%, #17b6d8 100%)",
  hairline: "rgba(31, 79, 216, 0.10)",
  hairlineStrong: "rgba(31, 79, 216, 0.18)",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  gray: "#71717a",
};

// ------------------------------------------------------------
// PHÂN QUYỀN (Data Masking) — 3 cấp độ theo nghiệp vụ:
// Viewer: chỉ tên/chức danh/điểm tổng quan
// Manager: xem năng lực kinh doanh + tính cách cơ bản,
//          KHÔNG xem chỉ số nhạy cảm (Stress, Mental, Dark Triad)
// HR Admin: mở khóa toàn bộ hồ sơ chuyên sâu
// ------------------------------------------------------------
const SENSITIVE_TRAITS = ["ストレス", "メンタル", "危険性"];

const ROLE_LABELS = {
  viewer: "Viewer",
  manager: "Manager",
  hr_admin: "HR Admin",
};

// ------------------------------------------------------------
// MOCK DATA — khớp cấu trúc Department / Employee từ backend
// (feature-based: features/org-chart/types.ts + mock)
// ------------------------------------------------------------
const initialDepartments = [
  {
    id: "ai-dev",
    name: "AI開発部",
    nameEn: "AI Development",
    employees: [
      { id: "EMP001", name: "佐藤 健太", nameEn: "Sato Kenta", role: "Lead Architect", fit: 92, traits: [["挑戦心", 88], ["緻密性", 94], ["論理性", 90]] },
      { id: "EMP014", name: "田中 雅人", nameEn: "Tanaka Masato", role: "ML Engineer", fit: 74, traits: [["挑戦心", 62], ["緻密性", 80], ["情報処", 85], ["ストレス", 71], ["メンタル", 66]] },
      { id: "EMP022", name: "小林 優", nameEn: "Kobayashi Yu", role: "Data Scientist", fit: 88, traits: [["緻密性", 91], ["論理性", 86], ["完遂力", 82]] },
    ],
  },
  {
    id: "solution-sales",
    name: "ソリューション営業部",
    nameEn: "Solution Sales",
    employees: [
      { id: "EMP045", name: "鈴木 一郎", nameEn: "Suzuki Ichiro", role: "Enterprise Sales", fit: 88, traits: [["説得交渉", 90], ["フットワーク", 85], ["向上心", 86]] },
      { id: "EMP052", name: "伊藤 翔太", nameEn: "Ito Shota", role: "Inside Sales", fit: 54, mismatch: true, traits: [["説得交渉", 45], ["緻密性", 89], ["論理性", 92]] },
      { id: "EMP060", name: "中村 翼", nameEn: "Nakamura Tsubasa", role: "Account Exec", fit: 65, traits: [["説得交渉", 68], ["協調性", 72], ["気さくさ", 70]] },
    ],
  },
  {
    id: "customer-success",
    name: "カスタマーサクセス",
    nameEn: "Customer Success",
    employees: [
      { id: "EMP089", name: "高橋 誠", nameEn: "Takahashi Makoto", role: "CS Lead", fit: 85, traits: [["協調優先", 92], ["感情安定", 86], ["配慮", 89]] },
      { id: "EMP092", name: "渡辺 健", nameEn: "Watanabe Ken", role: "Onboarding Spec", fit: 68, traits: [["協調優先", 65], ["感情安定", 70], ["役割意識", 75]] },
      { id: "EMP099", name: "森田 陸", nameEn: "Morita Riku", role: "CS Associate", fit: 0, missingData: true, traits: [["協調優先", 60]] },
      { id: "EMP105", name: "松本 遥", nameEn: "Matsumoto Haruka", role: "Support Lead", fit: 90, traits: [["協調優先", 95], ["感情安定", 91], ["回復力", 88]] },
    ],
  },
];

// Trọng số giả lập theo phòng ban — dùng để tính lại Fit Score client-side
const departmentWeights = {
  "ai-dev": { base: 0.6, variance: 18 },
  "solution-sales": { base: 0.5, variance: 22 },
  "customer-success": { base: 0.55, variance: 15 },
};

function recalcFitScore(employee, targetDeptId) {
  const w = departmentWeights[targetDeptId];
  const traitAvg = employee.traits.reduce((s, [, v]) => s + v, 0) / employee.traits.length;
  const seed = employee.id.charCodeAt(3) % 7;
  const score = Math.round(traitAvg * w.base + (w.variance - seed * 2));
  return Math.max(30, Math.min(99, score));
}

function fitColor(score, missingData) {
  if (missingData) return { text: tokens.gray, bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.3)" };
  if (score >= 80) return { text: tokens.green, bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.35)" };
  if (score >= 60) return { text: tokens.amber, bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.35)" };
  return { text: tokens.red, bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.35)" };
}

function statusDotColor(score, missingData) {
  if (missingData) return tokens.gray;
  if (score >= 80) return tokens.green;
  if (score >= 60) return tokens.amber;
  return tokens.red;
}

// Ẩn (mask) các chỉ số nhạy cảm theo vai trò người xem
function visibleTraits(traits, role) {
  if (role === "hr_admin") return traits;
  return traits.filter(([label]) => !SENSITIVE_TRAITS.includes(label));
}

// ------------------------------------------------------------
// EmployeeCard — Thẻ nhân sự tinh tế, chỉ 1 chấm trạng thái
// ------------------------------------------------------------
function EmployeeCard({ employee, onDragStart, isDragging, justUpdated, isMismatch, role, locked }) {
  const colors = fitColor(employee.fit, employee.missingData);
  const traits = visibleTraits(employee.traits, role);

  if (role === "viewer") {
    // Viewer: chỉ tên, chức danh, điểm tổng quan — không traits, không cảnh báo lệch vị trí
    return (
      <div style={{ background: "#ffffff", border: `1px solid ${tokens.hairline}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor(employee.fit, employee.missingData) }} />
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "#14142b" }}>{employee.name} ({employee.nameEn})</span>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "3px 10px" }}>
            {employee.missingData ? "データ不足" : `Fit: ${employee.fit}%`}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#71717a", marginLeft: 15, marginTop: 4 }}>位置: {employee.role}</div>
      </div>
    );
  }

  return (
    <div
      draggable={!locked}
      onDragStart={(e) => !locked && onDragStart(e, employee)}
      style={{
        background: "#ffffff",
        border: `1px solid ${isMismatch ? "rgba(220,38,38,0.4)" : tokens.hairline}`,
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 10,
        cursor: "grab",
        opacity: isDragging ? 0.35 : 1,
        boxShadow: isMismatch
          ? "0 1px 2px rgba(220,38,38,0.06), 0 4px 14px rgba(220,38,38,0.08)"
          : "0 1px 2px rgba(20,20,43,0.03), 0 4px 14px rgba(20,20,43,0.04)",
        transition: "box-shadow 180ms ease, transform 180ms ease, background 400ms ease",
        transform: justUpdated ? "scale(1.015)" : "scale(1)",
        background: justUpdated ? "rgba(23,182,216,0.05)" : "#ffffff",
        cursor: locked ? "not-allowed" : "grab",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: statusDotColor(employee.fit, employee.missingData),
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${colors.bg}`,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#14142b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {employee.id} : {employee.name} ({employee.nameEn})
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: colors.text,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 999,
            padding: "3px 10px",
            flexShrink: 0,
            transition: "all 300ms ease",
          }}
        >
          {employee.missingData ? "データ不足" : `Fit: ${employee.fit}%`}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#71717a", marginLeft: 15, marginBottom: 6 }}>
        位置: {employee.role}
        {isMismatch && (
          <span style={{ color: tokens.red, marginLeft: 8, fontWeight: 500 }}>
            ・現在レベル差 ({100 - employee.fit}%↓)
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, marginLeft: 15, flexWrap: "wrap" }}>
        {traits.map(([label, val]) => (
          <span key={label} style={{ fontSize: 11, color: "#a1a1aa" }}>
            {label}: {val}
          </span>
        ))}
        {role === "manager" && employee.traits.length > traits.length && (
          <span style={{ fontSize: 11, color: "#c4c4cb", display: "flex", alignItems: "center", gap: 3 }}>
            <Lock size={10} /> {employee.traits.length - traits.length} chỉ số bị ẩn
          </span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// DepartmentColumn
// ------------------------------------------------------------
function DepartmentColumn({ dept, avgFit, onDragStart, onDrop, draggedEmployee, dragOverDept, setDragOverDept, justUpdatedId, mismatchId, role, locked }) {
  const isOver = dragOverDept === dept.id;
  return (
    <div
      onDragOver={(e) => {
        if (locked) return;
        e.preventDefault();
        setDragOverDept(dept.id);
      }}
      onDragLeave={() => setDragOverDept(null)}
      onDrop={(e) => !locked && onDrop(e, dept.id)}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: `1px solid ${tokens.hairline}`,
        boxShadow: "0 1px 2px rgba(20,20,43,0.02), 0 8px 24px rgba(20,20,43,0.03)",
        padding: 18,
        minHeight: 420,
        flex: 1,
        minWidth: 300,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: "#14142b" }}>
          {dept.name} <span style={{ color: "#a1a1aa", fontWeight: 400 }}>({dept.nameEn})</span>
        </div>
        <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 2 }}>
          平均適合度: {avgFit}% ・ {dept.employees.length}名
        </div>
      </div>

      {dept.employees.map((emp) => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          onDragStart={onDragStart}
          isDragging={draggedEmployee?.id === emp.id}
          justUpdated={justUpdatedId === emp.id}
          isMismatch={mismatchId === emp.id}
          role={role}
          locked={locked}
        />
      ))}

      {draggedEmployee && (
        <div
          style={{
            marginTop: 8,
            border: `1.5px dashed ${isOver ? tokens.green : "rgba(161,161,170,0.4)"}`,
            borderRadius: 12,
            padding: "18px 12px",
            textAlign: "center",
            fontSize: 12,
            color: isOver ? tokens.green : "#a1a1aa",
            background: isOver ? "rgba(22,163,74,0.05)" : "transparent",
            transition: "all 150ms ease",
          }}
        >
          {dept.employees.find((e) => e.id === draggedEmployee.id)
            ? "既にこの部署に所属"
            : "ここにドロップして異動 (Fit Score を即時再計算 <100ms)"}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// TopBar — search Spotlight, scenario selector, Undo/Redo, Commit
// ------------------------------------------------------------
function TopBar({ searchFocused, setSearchFocused, canUndo, canRedo, onUndo, onRedo, actionCount, role, setRole, scenarioStatus, onSubmit, onApprove, locked }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderBottom: `1px solid ${tokens.hairline}`,
        padding: "14px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, fontSize: 16, color: "#14142b" }}>
          TalentLens
          <span style={{ color: "#d4d4d8" }}>|</span>
          <span style={{ fontSize: 13, color: "#71717a", display: "flex", alignItems: "center", gap: 4 }}>
            Musashino AI事業部 <ChevronDown size={13} />
          </span>
        </div>

        <div
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          tabIndex={0}
          style={{
            flex: 1,
            maxWidth: 480,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 999,
            border: `1.5px solid ${searchFocused ? "transparent" : tokens.hairline}`,
            background: searchFocused ? "#fff" : "#fafafb",
            backgroundImage: searchFocused ? tokens.gradient : "none",
            backgroundOrigin: "border-box",
            boxShadow: searchFocused ? `inset 0 0 0 1.5px #fff, 0 0 0 3px rgba(23,182,216,0.12)` : "none",
            cursor: "text",
            outline: "none",
          }}
        >
          <Search size={14} color={searchFocused ? tokens.indigo : "#a1a1aa"} />
          <span style={{ fontSize: 13, color: "#a1a1aa" }}>
            自然言語検索: "ドライバーで挑戦心が80以上..."
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "#c4c4cb" }}>
            <Command size={11} />K
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {/* Role switcher — demo phân quyền Data Masking, thực tế lấy role từ JWT (core/auth) */}
          <div style={{ display: "flex", background: "#fafafb", border: `1px solid ${tokens.hairline}`, borderRadius: 999, padding: 3, gap: 2 }}>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: role === key ? "#fff" : "#71717a",
                  background: role === key ? tokens.indigo : "transparent",
                  border: "none",
                  borderRadius: 999,
                  padding: "4px 11px",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "#3f3f46" }}>Yamada Taro</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ToggleButton icon={<LayoutGrid size={13} />} label="組織図 2D" active />
        <ToggleButton icon={<Boxes size={13} />} label="ネットワーク 3D" />

        <div style={{ marginLeft: 8, fontSize: 12.5, color: "#71717a", display: "flex", alignItems: "center", gap: 6 }}>
          シナリオ:
          <span
            style={{
              fontWeight: 500,
              color: "#14142b",
              background: "#fafafb",
              border: `1px solid ${tokens.hairline}`,
              borderRadius: 999,
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            計画 8月2026 <ChevronDown size={12} />
          </span>
          <ScenarioStatusBadge status={scenarioStatus} />
        </div>

        <button onClick={onUndo} disabled={!canUndo} style={ghostBtnStyle(canUndo)}>
          <Undo2 size={13} /> Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} style={ghostBtnStyle(canRedo)}>
          <Redo2 size={13} /> Redo
        </button>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {locked && (
            <span style={{ fontSize: 11.5, color: tokens.gray, display: "flex", alignItems: "center", gap: 4 }}>
              <Lock size={11} /> Đã commit — chỉ xem
            </span>
          )}
          {!locked && actionCount > 0 && (
            <span style={{ fontSize: 11.5, color: "#a1a1aa" }}>{actionCount} thay đổi chưa lưu</span>
          )}

          {/* Manager: chỉ được lưu nháp / gửi duyệt, không tự Commit */}
          {role === "manager" && !locked && (
            <>
              <button style={outlineBtnStyle}>
                <Save size={13} /> Lưu nháp
              </button>
              <button style={gradientBtnStyle} onClick={onSubmit} disabled={scenarioStatus !== "draft"}>
                <Send size={13} /> Gửi duyệt
              </button>
            </>
          )}

          {/* HR Admin: duyệt và Commit chính thức vào sơ đồ tổ chức thật */}
          {role === "hr_admin" && !locked && (
            <>
              <button style={outlineBtnStyle}>
                <Save size={13} /> Lưu nháp
              </button>
              <button
                style={{ ...gradientBtnStyle, opacity: scenarioStatus === "submitted" ? 1 : 0.5, cursor: scenarioStatus === "submitted" ? "pointer" : "not-allowed" }}
                onClick={onApprove}
                disabled={scenarioStatus !== "submitted"}
                title={scenarioStatus !== "submitted" ? "Chờ Manager gửi duyệt trước" : "Duyệt và ghi đè vào sơ đồ thực tế"}
              >
                <ShieldCheck size={13} /> Duyệt & Commit
              </button>
            </>
          )}

          {role === "viewer" && (
            <span style={{ fontSize: 11.5, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 4 }}>
              <Eye size={12} /> Chế độ chỉ xem
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioStatusBadge({ status }) {
  const map = {
    draft: { label: "Draft", color: tokens.gray, bg: "rgba(113,113,122,0.08)" },
    submitted: { label: "Submitted — chờ duyệt", color: tokens.amber, bg: "rgba(217,119,6,0.08)" },
    committed: { label: "Committed", color: tokens.green, bg: "rgba(22,163,74,0.08)" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: s.color, background: s.bg, borderRadius: 999, padding: "3px 10px" }}>
      {s.label}
    </span>
  );
}

function ToggleButton({ icon, label, active }) {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        fontWeight: 500,
        color: active ? tokens.indigo : "#71717a",
        background: active ? "rgba(31,79,216,0.07)" : "transparent",
        border: `1px solid ${active ? "rgba(31,79,216,0.2)" : tokens.hairline}`,
        borderRadius: 999,
        padding: "6px 14px",
        cursor: "pointer",
      }}
    >
      {icon} {label}
    </button>
  );
}

const ghostBtnStyle = (enabled) => ({
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12.5,
  color: enabled ? "#3f3f46" : "#d4d4d8",
  background: "transparent",
  border: `1px solid ${tokens.hairline}`,
  borderRadius: 999,
  padding: "6px 12px",
  cursor: enabled ? "pointer" : "not-allowed",
});

const outlineBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12.5,
  fontWeight: 500,
  color: tokens.indigo,
  background: "#fff",
  border: `1px solid rgba(31,79,216,0.25)`,
  borderRadius: 999,
  padding: "7px 16px",
  cursor: "pointer",
};

const gradientBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12.5,
  fontWeight: 500,
  color: "#fff",
  background: tokens.gradient,
  border: "none",
  borderRadius: 999,
  padding: "7px 18px",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(23,182,216,0.28)",
};

// ------------------------------------------------------------
// ROOT — OrgChartBoard (mô phỏng features/org-chart)
// Zustand-style state được thể hiện qua useState + reducer nhỏ
// để độc lập với Server State (React Query sẽ fetch dữ liệu gốc)
// ------------------------------------------------------------
export default function OrgChartBoard() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [draggedFromDept, setDraggedFromDept] = useState(null);
  const [dragOverDept, setDragOverDept] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [justUpdatedId, setJustUpdatedId] = useState(null);
  const [role, setRole] = useState("hr_admin"); // demo: đổi nhanh giữa 3 cấp quyền
  const [scenarioStatus, setScenarioStatus] = useState("draft"); // draft -> submitted -> committed
  const locked = scenarioStatus === "committed";

  // Lịch sử hành động — tối đa 20 bước, chỉ đóng gói gửi lên
  // FastAPI khi người dùng nhấn "Lưu nháp" / "Commit"
  const historyRef = useRef([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [actionLog, setActionLog] = useState([]);

  const handleDragStart = useCallback((e, employee) => {
    const fromDept = departments.find((d) => d.employees.some((emp) => emp.id === employee.id));
    setDraggedEmployee(employee);
    setDraggedFromDept(fromDept?.id ?? null);
  }, [departments]);

  const handleDrop = useCallback(
    (e, targetDeptId) => {
      e.preventDefault();
      setDragOverDept(null);
      if (!draggedEmployee || targetDeptId === draggedFromDept) {
        setDraggedEmployee(null);
        return;
      }

      const newFit = recalcFitScore(draggedEmployee, targetDeptId);

      setDepartments((prev) =>
        prev.map((dept) => {
          if (dept.id === draggedFromDept) {
            return { ...dept, employees: dept.employees.filter((e) => e.id !== draggedEmployee.id) };
          }
          if (dept.id === targetDeptId) {
            return {
              ...dept,
              employees: [...dept.employees, { ...draggedEmployee, fit: newFit, mismatch: false }],
            };
          }
          return dept;
        })
      );

      const action = {
        type: "MOVE_EMPLOYEE",
        employeeId: draggedEmployee.id,
        from: draggedFromDept,
        to: targetDeptId,
        newFit,
        ts: Date.now(),
      };
      const nextHistory = historyRef.current.slice(0, historyIndex + 1).concat(action).slice(-20);
      historyRef.current = nextHistory;
      setHistoryIndex(nextHistory.length - 1);
      setActionLog(nextHistory);

      setJustUpdatedId(draggedEmployee.id);
      setTimeout(() => setJustUpdatedId(null), 600);
      setDraggedEmployee(null);
      setDraggedFromDept(null);
    },
    [draggedEmployee, draggedFromDept, historyIndex]
  );

  const avgFit = (dept) => Math.round(dept.employees.reduce((s, e) => s + e.fit, 0) / (dept.employees.length || 1));

  const mismatchEmployee = useMemo(() => {
    for (const dept of departments) {
      const found = dept.employees.find((e) => e.mismatch);
      if (found) return found.id;
    }
    return null;
  }, [departments]);

  return (
    <div style={{ background: tokens.canvas, minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <TopBar
        searchFocused={searchFocused}
        setSearchFocused={setSearchFocused}
        canUndo={historyIndex >= 0 && !locked}
        canRedo={historyIndex < actionLog.length - 1 && !locked}
        onUndo={() => setHistoryIndex((i) => Math.max(-1, i - 1))}
        onRedo={() => setHistoryIndex((i) => Math.min(actionLog.length - 1, i + 1))}
        actionCount={historyIndex + 1}
        role={role}
        setRole={setRole}
        scenarioStatus={scenarioStatus}
        onSubmit={() => setScenarioStatus("submitted")}
        onApprove={() => setScenarioStatus("committed")}
        locked={locked}
      />

      <div style={{ display: "flex", gap: 20, padding: 24, alignItems: "flex-start" }}>
        {departments.map((dept) => (
          <DepartmentColumn
            key={dept.id}
            dept={dept}
            avgFit={avgFit(dept)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            draggedEmployee={draggedEmployee}
            dragOverDept={dragOverDept}
            setDragOverDept={setDragOverDept}
            justUpdatedId={justUpdatedId}
            mismatchId={mismatchEmployee}
            role={role}
            locked={locked}
          />
        ))}
      </div>
    </div>
  );
}
