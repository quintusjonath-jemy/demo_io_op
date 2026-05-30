import React from "react";

const JutsuCard = ({ image, title, active }) => {
  return (
    <div className={`sign-card ${active ? "sign-active" : ""}`}>
      <h2>Target Hand Sign</h2>
      <img src={image} alt={title} className="sign-image" />
      <p>{title}</p>
    </div>
  );
};

export default JutsuCard;
