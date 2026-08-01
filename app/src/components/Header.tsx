import { memo, type JSX } from "react";

import { shortcutName, shortcutURL } from "@api/global-variables";

const assetPath = `https://www.heismauri.com/assets/shortcuts/${shortcutName.toLowerCase()}`;

const Header = (): JSX.Element => {
  return (
    <header>
      <h1 className="py-4 m-0">{shortcutName}</h1>
      <img
        className="d-block mx-auto shortcut-icon"
        width="200"
        height="200"
        alt={`${shortcutName}'s shortcut icon`}
        srcSet={`${assetPath}/icon-x2.png 2x, ${assetPath}/icon-x3.png 3x`}
        src={`${assetPath}/icon.png`}
      />
      <p className="py-4 m-0">
        This API also works with the Siri Shortcut <strong>&quot;{shortcutName}&quot;</strong> which can be
        downloaded on <a href={shortcutURL}>RoutineHub</a>
      </p>
    </header>
  );
};

export default memo(Header);
