import React, { ReactNode } from "react";

type Props = Readonly<{
  "data-test-id"?: string;
  children: ReactNode;
}>;

export const DialogButtonsList: React.FC<Props> = ({ children }) => {
  return <div className="dialogbuttonslist">{children}</div>;
};

export const DialogActions: React.FC<Props> = ({
  "data-test-id": dataTestId,
  children,
}) => {
  return (
    <div className="dialogactions" data-test-id={dataTestId}>
      {children}
    </div>
  );
};
