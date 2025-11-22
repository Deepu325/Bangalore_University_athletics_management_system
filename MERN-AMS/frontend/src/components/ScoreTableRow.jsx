import React, { memo } from "react";
import { TimeInput, DecimalInput, IntegerInput } from "./ScoreInputs";

// ScoreTableRow: a single row in the scoring table with Status (OK/DNF/DIS)
// Props:
// - athlete: athlete object { _id, name, chestNo, college, ... }
// - scoreValue: current score string (from parent scores map)
// - scoreStatus: current status ('OK', 'DNF', 'DIS') from parent scoreStatus map
// - eventType: 'track' | 'relay' | 'jump' | 'throw' | 'field' | 'combined'
// - onScoreCommit: function(id, value) -> called on input blur/commit
// - onStatusChange: function(id, status) -> called when status dropdown changes
// - slNo: optional serial number
const ScoreTableRow = memo(function ScoreTableRow({
  athlete,
  scoreValue,
  scoreStatus = "OK",
  eventType = "track",
  onScoreCommit,
  onStatusChange,
  slNo
}) {
  const id = athlete._id || athlete.id || athlete.chestNo || Math.random().toString(36).slice(2, 9);

  // Render athlete college safely
  const collegeName = (() => {
    if (!athlete) return "";
    if (typeof athlete.college === "string") return athlete.college;
    if (athlete.college && typeof athlete.college === "object") return athlete.college.name || "";
    return "";
  })();

  // Disable score input if DNF or DIS selected
  const isDisabled = scoreStatus === "DNF" || scoreStatus === "DIS";

  // Choose which input component to render based on eventType
  const renderInput = () => {
    const defaultVal = scoreValue ?? athlete.performance ?? "";

    // Track & Relay → TimeInput
    if (eventType === "track" || eventType === "relay") {
      return (
        <TimeInput
          athleteId={id}
          disabled={isDisabled}
          defaultValue={defaultVal}
          onCommit={(athleteId, val) => onScoreCommit && onScoreCommit(athleteId, val)}
        />
      );
    }

    // Field / Jump / Throw → DecimalInput
    if (eventType === "field" || eventType === "jump" || eventType === "throw") {
      return (
        <DecimalInput
          athleteId={id}
          disabled={isDisabled}
          defaultValue={defaultVal}
          onCommit={(athleteId, val) => onScoreCommit && onScoreCommit(athleteId, val)}
        />
      );
    }

    // Combined events → IntegerInput
    if (eventType === "combined") {
      return (
        <IntegerInput
          athleteId={id}
          disabled={isDisabled}
          defaultValue={defaultVal}
          onCommit={(athleteId, val) => onScoreCommit && onScoreCommit(athleteId, val)}
        />
      );
    }

    // Fallback: use DecimalInput
    return (
      <DecimalInput
        athleteId={id}
        disabled={isDisabled}
        defaultValue={defaultVal}
        onCommit={(athleteId, val) => onScoreCommit && onScoreCommit(athleteId, val)}
      />
    );
  };

  return (
    <tr>
      <td style={{ width: "6%", textAlign: "center", padding: "8px" }}>{slNo ?? "-"}</td>
      <td style={{ width: "10%", textAlign: "center", padding: "8px" }}>{athlete.chestNo ?? "-"}</td>
      <td style={{ width: "30%", padding: "8px" }}>{athlete.name}</td>
      <td style={{ width: "25%", padding: "8px" }}>{collegeName}</td>
      
      {/* SCORE INPUT COLUMN */}
      <td style={{ width: "12%", padding: "8px", textAlign: "center" }}>
        {renderInput()}
      </td>

      {/* STATUS DROPDOWN: OK / DNF / DIS */}
      <td style={{ width: "17%", padding: "8px", textAlign: "center" }}>
        <select
          value={scoreStatus || "OK"}
          onChange={(e) => onStatusChange && onStatusChange(id, e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          style={{
            minWidth: "90px",
            backgroundColor: 
              scoreStatus === "DIS" ? "#fee2e2" :
              scoreStatus === "DNF" ? "#fef3c7" :
              "white"
          }}
          tabIndex={0}
        >
          <option value="OK">✓ OK</option>
          <option value="DNF">⚠ DNF</option>
          <option value="DIS">✗ DIS</option>
        </select>
      </td>
    </tr>
  );
},
// custom compare: re-render only if score, status, athlete id, or eventType changes
(prev, next) =>
  prev.scoreValue === next.scoreValue &&
  prev.scoreStatus === next.scoreStatus &&
  (prev.athlete?._id || prev.athlete?.id) === (next.athlete?._id || next.athlete?.id) &&
  prev.eventType === next.eventType
);

ScoreTableRow.displayName = "ScoreTableRow";
export default ScoreTableRow;
