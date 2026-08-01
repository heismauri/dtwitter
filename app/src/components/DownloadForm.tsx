import { type JSX, type RefObject, type SubmitEvent } from "react";

const DownloadForm = ({
  formRef,
  url,
  onUrlChange,
  onSubmit,
  disabled
}: {
  formRef: RefObject<HTMLFormElement | null>;
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  disabled: boolean;
}): JSX.Element => {
  return (
    <form ref={formRef} className="form-group w-100 d-flex my-4" onSubmit={onSubmit}>
      <input
        className="downloader-url w-100 me-2"
        type="text"
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder="Your DTwitter link goes here!"
      />
      <button className="btn btn-download" type="submit" disabled={disabled}>
        Download
      </button>
    </form>
  );
};

export default DownloadForm;
