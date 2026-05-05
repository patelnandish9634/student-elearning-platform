import React from "react";

const StatsCard = ({ title, value, color }) => {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        borderLeft: `5px solid ${color}`,
      }}
    >
      {/* <p style={{ margin: 0, color: "gray" }}>{title}</p>
      <h2 style={{ marginTop: "10px" }}>{value}</h2> */}
    </div>
  );
};

export default StatsCard;
