import React, { useState } from "react";

let idCounter = 0;

// Random RGB color
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
};

const Cell = ({ initialState, onRemove, isRoot = false }) => {
  const [splitDirection, setSplitDirection] = useState(initialState?.splitDirection || null);
  const [children, setChildren] = useState(initialState?.children || []);
  const currentColor = initialState?.color || getRandomColor();

  const handleSplit = (direction, e) => {
    e.stopPropagation();
    if (!splitDirection) {
      setSplitDirection(direction);
      setChildren([
        { id: idCounter++, color: currentColor, splitDirection: null, children: [] },
        { id: idCounter++, color: getRandomColor(), splitDirection: null, children: [] },
      ]);
    }
  };

  const handleChildRemove = (childId) => {
    setChildren((prev) => prev.filter((c) => c.id !== childId));
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove && !isRoot) onRemove();
  };

  // Single cell
  if (!splitDirection || children.length === 0) {
    return (
      <div
        style={{ backgroundColor: currentColor }}
        className="relative flex items-center justify-center w-full h-full transition-colors duration-200"
      >
        <div className="absolute top-2 left-2 flex gap-1">
          <button
            onClick={(e) => handleSplit("vertical", e)}
            className="px-3 py-1.5 bg-white bg-opacity-90 text-xs font-semibold text-gray-700 rounded shadow hover:bg-opacity-100 transition-all"
          >
            V
          </button>
          <button
            onClick={(e) => handleSplit("horizontal", e)}
            className="px-3 py-1.5 bg-white bg-opacity-90 text-xs font-semibold text-gray-700 rounded shadow hover:bg-opacity-100 transition-all"
          >
            H
          </button>
          {!isRoot && (
            <button
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-xs font-semibold text-white rounded shadow hover:bg-red-700 transition-all"
            >
              −
            </button>
          )}
        </div>
      </div>
    );
  }

  // Split cells using flex
  return (
    <div
      className={`w-full h-full flex gap-1 ${splitDirection === "vertical" ? "flex-row" : "flex-col"}`}
    >
      {children.map((child) => (
        <div key={child.id} className="flex-1 h-full w-full">
          <Cell
            initialState={child}
            onRemove={() => handleChildRemove(child.id)}
            isRoot={false}
          />
        </div>
      ))}
    </div>
  );
};

const App = () => {
  return (
    <div className="w-screen h-screen p-4 bg-gray-100">
      <div className="w-full h-full bg-white shadow-lg rounded-lg overflow-hidden">
        <Cell initialState={{ color: getRandomColor() }} isRoot={true} />
      </div>
    </div>
  );
};

export default App;
