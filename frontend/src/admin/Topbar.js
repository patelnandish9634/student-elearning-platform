import React from "react";
import { FiBell, FiSettings } from "react-icons/fi";

const Topbar = () => {
  return (
    <header
      style={{
        background: "#ffffff",
        padding: "16px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 6px 8px -4px rgba(15, 23, 42, 0.15)",
        zIndex: 10, // ✅ stays above content while scrolling
        marginLeft:"-1px",
     
      }}
    >
      {/* Left Title */}
      <h2
        style={{
          margin: 0,
          fontSize: "25px",
          fontWeight: "700",
          color: "#0f172a",
        }}
      >
        LJ University Admin
      </h2>

      {/* Right Icons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <FiBell
          style={{
            fontSize: "20px",
            color: "#475569",
            cursor: "pointer",
          }}
        />

        <FiSettings
          style={{
            fontSize: "20px",
            color: "#475569",
            cursor: "pointer",
          }}
        />

        {/* Avatar */}
        <div
          style={{
            width: "36px",
            height: "36px",
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          AD
        </div>
      </div>
    </header>
  );
};

export default Topbar;
