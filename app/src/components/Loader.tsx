import { memo, type JSX } from "react";

const Loader = (): JSX.Element => {
  return (
    <div className="ellipsis-loader">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default memo(Loader);
