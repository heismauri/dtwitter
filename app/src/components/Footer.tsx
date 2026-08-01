import { memo, type JSX } from "react";

import { shortcutName } from "@api/global-variables";

const Footer = (): JSX.Element => {
  return (
    <>
      <a className="btn btn-kofi fw-normal mx-auto my-4" href="https://ko-fi.com/heismauri">
        Love <strong>{shortcutName}</strong>? <i className="fa-regular fa-heart"></i> Buy me a Ko-fi!
      </a>
      <footer className="copyright text-center my-4 m-0">
        <a className="text-decoration-none" href="https://www.heismauri.com/">
          www.heismauri.com
        </a>
      </footer>
    </>
  );
};

export default memo(Footer);
