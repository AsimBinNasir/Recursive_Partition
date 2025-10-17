import { useState, useRef, useCallback } from "react";

const generateColor = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 65%)`;
const generateId = () => Math.random().toString(36).substr(2, 9);

const App = () => {
  const [rootCell, setRootCell] = useState({ id: generateId(), color: generateColor() });

  const splitCell = (path, direction) => {
    setRootCell(prev => {
      const newRoot = JSON.parse(JSON.stringify(prev));
      const splitRecursive = (node, currentPath) => {
        if (currentPath.length === 0) return {
          ...node,
          split: { direction, ratio: 0.5, children: [
            { id: generateId(), color: node.color },
            { id: generateId(), color: generateColor() }
          ]}
        };
        const nextIndex = currentPath[0];
        return {
          ...node,
          split: {
            ...node.split,
            children: node.split.children.map((child, index) =>
              index === nextIndex ? splitRecursive(child, currentPath.slice(1)) : child
            )
          }
        };
      };
      return splitRecursive(newRoot, path);
    });
  };

  const removeCell = (path) => {
    if (path.length === 0) return;
    setRootCell(prev => {
      const newRoot = JSON.parse(JSON.stringify(prev));
      const removeRecursive = (node, currentPath) => {
        if (currentPath.length === 1) return node.split.children[currentPath[0] === 0 ? 1 : 0];
        const nextIndex = currentPath[0];
        return {
          ...node,
          split: {
            ...node.split,
            children: node.split.children.map((child, index) =>
              index === nextIndex ? removeRecursive(child, currentPath.slice(1)) : child
            )
          }
        };
      };
      return removeRecursive(newRoot, path);
    });
  };

  const updateSplitRatio = (path, newRatio) => {
    setRootCell(prev => {
      const newRoot = JSON.parse(JSON.stringify(prev));
      const updateRecursive = (node, currentPath) => {
        if (currentPath.length === 0) return { ...node, split: { ...node.split, ratio: newRatio } };
        const nextIndex = currentPath[0];
        return {
          ...node,
          split: {
            ...node.split,
            children: node.split.children.map((child, index) =>
              index === nextIndex ? updateRecursive(child, currentPath.slice(1)) : child
            )
          }
        };
      };
      return updateRecursive(newRoot, path);
    });
  };

  return (
    <div className="h-screen w-screen bg-gray-900 p-4">
      <div className="h-full w-full">
        <CellComponent cell={rootCell} path={[]} onSplit={splitCell} onRemove={removeCell} onRatioChange={updateSplitRatio} />
      </div>
    </div>
  );
};

const CellComponent = ({ cell, path, onSplit, onRemove, onRatioChange }) => {
  const splitterRef = useRef(null);
  const isDragging = useRef(false);
  const [snapIndicator, setSnapIndicator] = useState(null);

  const handleSplitterMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const container = splitterRef.current.parentElement;
    const isHorizontal = cell.split.direction === "H";
    const startRatio = cell.split.ratio;

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const containerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;
      const delta = isHorizontal ? e.clientX - startX : e.clientY - startY;
      let newRatio = startRatio + delta / containerSize;
      newRatio = Math.max(0.1, Math.min(0.9, newRatio));
      
      const snapPoints = [{ ratio: 0.25, label: "1/4" }, { ratio: 0.5, label: "1/2" }, { ratio: 0.75, label: "3/4" }];
      const snapThreshold = 0.02;
      let snappedRatio = newRatio;
      let snapLabel = null;
      
      for (const snapPoint of snapPoints) {
        if (Math.abs(newRatio - snapPoint.ratio) < snapThreshold) {
          snappedRatio = snapPoint.ratio;
          snapLabel = snapPoint.label;
          break;
        }
      }
      
      if (snapLabel) setSnapIndicator({ x: e.clientX + 10, y: e.clientY + 10, label: snapLabel });
      else setSnapIndicator(null);
      
      onRatioChange(path, snappedRatio);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setSnapIndicator(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
  }, [cell.split, path, onRatioChange]);

  if (cell.split) {
    const isHorizontal = cell.split.direction === "H";
    const ratio = cell.split.ratio || 0.5;

    return (
      <div className={`flex ${isHorizontal ? "flex-row" : "flex-col"} h-full w-full relative`}>
        <div className={isHorizontal ? "h-full" : "w-full"} style={{ [isHorizontal ? "width" : "height"]: `${ratio * 100}%` }}>
          <CellComponent cell={cell.split.children[0]} path={[...path, 0]} onSplit={onSplit} onRemove={onRemove} onRatioChange={onRatioChange} />
        </div>
        <div
          ref={splitterRef}
          className={`absolute bg-gray-400 hover:bg-blue-500 active:bg-blue-600 transition-colors duration-150 z-10 ${
            isHorizontal ? "w-1 h-full cursor-col-resize -translate-x-1/2" : "h-1 w-full cursor-row-resize -translate-y-1/2"
          }`}
          style={{ [isHorizontal ? "left" : "top"]: `${ratio * 100}%` }}
          onMouseDown={handleSplitterMouseDown}
        />
        <div className={isHorizontal ? "h-full" : "w-full"} style={{ [isHorizontal ? "width" : "height"]: `${(1 - ratio) * 100}%` }}>
          <CellComponent cell={cell.split.children[1]} path={[...path, 1]} onSplit={onSplit} onRemove={onRemove} onRatioChange={onRatioChange} />
        </div>
        {snapIndicator && (
          <div className="fixed z-50 bg-blue-600 text-white px-2 py-1 rounded shadow-lg font-semibold text-xs pointer-events-none"
            style={{ left: snapIndicator.x, top: snapIndicator.y, transform: 'translateY(-100%)' }}>
            {snapIndicator.label}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center relative group" style={{ backgroundColor: cell.color }}>
      <div className="flex gap-1">
        <button
          onClick={() => onSplit(path, "H")}
          className="px-2 py-1 bg-white/90 hover:bg-white text-xs font-medium rounded shadow hover:scale-105 transition-all"
        >
          V
        </button>
        <button
          onClick={() => onSplit(path, "V")}
          className="px-2 py-1 bg-white/90 hover:bg-white text-xs font-medium rounded shadow hover:scale-105 transition-all"
        >
          H
        </button>
      </div>
      {path.length > 0 && (
        <button
          onClick={() => onRemove(path) }
          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded shadow opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center justify-center text-xs"
        >
          −
        </button>
      )}
    </div>
  );
};

export default App;