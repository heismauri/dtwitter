import { useRef, useState, type JSX, type SubmitEvent } from "react";

import { latestVersion } from "@api/global-variables";
import type { JsonBuilderResult, MediaResult } from "@api/types/MediaResult";
import DownloadForm from "@app/components/DownloadForm";
import Footer from "@app/components/Footer";
import Header from "@app/components/Header";
import Loader from "@app/components/Loader";
import MediaResults from "@app/components/MediaResults";
import { urlValidator } from "@app/utils";

const dtwitterAPI = async (url: string): Promise<JsonBuilderResult> => {
  const downloaderForm = new FormData();
  downloaderForm.append("url", url);
  downloaderForm.append("version", latestVersion);
  const response = await fetch("/", {
    method: "POST",
    body: downloaderForm
  });
  if (!response.ok) {
    const data: { error: string } = await response.json();
    throw new Error(data.error);
  }
  return response.json();
};

const App = (): JSX.Element => {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const [media, setMedia] = useState<MediaResult[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!url) return;
    setSubmitting(true);
    setState("loading");
    setMedia([]);
    const { success: validUrl, url: expandedUrl } = await urlValidator(url);
    if (!validUrl) {
      window.alert(`Please insert a valid URL (${expandedUrl})`);
      setState("idle");
      setSubmitting(false);
      return;
    }
    try {
      const data = await dtwitterAPI(expandedUrl);
      setMedia(data.media);
      setState("success");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "There was an unknown error.");
      console.error(error);
      setState("idle");
    }
    setTimeout(() => setSubmitting(false), 2000);
    formRef.current?.scrollIntoView();
  };

  return (
    <main className="container text-center dtwitter">
      <Header />
      <p className="m-0">
        <i>The web downloader is still in Beta, make sure to report any errors!</i>
      </p>
      <DownloadForm
        formRef={formRef}
        url={url}
        onUrlChange={setUrl}
        onSubmit={(event) => void handleSubmit(event)}
        disabled={submitting}
      />
      <div id="downloader-media" className={state === "success" ? "content" : ""}>
        {state === "loading" && <Loader />}
        {state === "success" && <MediaResults media={media} />}
      </div>
      <Footer />
    </main>
  );
};

export default App;
