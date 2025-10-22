import React from "react";

interface AHeaderTextProps {
  children: React.ReactNode;
}

function AHeaderText(props: AHeaderTextProps) {
  return (
    <h1 className="text-2xl font-bold text-base-content">{props.children}</h1>
  );
}

export default AHeaderText;
