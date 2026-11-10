import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [installEvent, setInstallEvent] = useState(null);
  const [installError, setInstallError] = useState("");
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const online = () => setOffline(false);
    const offline = () => setOffline(true);
    const install = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const installed = () => setInstallEvent(null);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  async function install() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } catch {
      setInstallError(
        "Chưa thể cài tự động. Hãy dùng menu trình duyệt → Thêm vào màn hình chính.",
      );
      setInstallEvent(null);
    }
  }
  if (!offline && !needRefresh && !installEvent && !installError) return null;
  return (
    <aside
      className="border-b border-emerald-100 bg-emerald-50"
      aria-label="Trạng thái ứng dụng"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3 text-sm text-emerald-950">
        {offline && (
          <p role="status">
            Bạn đang ngoại tuyến. Giao dịch được lưu trên thiết bị và chờ đồng bộ khi có mạng.
          </p>
        )}
        {installEvent && (
          <button type="button" className="secondary" onClick={install}>
            Cài ứng dụng
          </button>
        )}
        {installError && <p role="status">{installError}</p>}
        {needRefresh && (
          <>
            <p>
              Có phiên bản mới. Hãy lưu nội dung đang nhập trước khi cập nhật.
            </p>
            <button
              className="primary"
              onClick={() => updateServiceWorker(true)}
            >
              Cập nhật
            </button>
            <button
              className="text-button"
              onClick={() => setNeedRefresh(false)}
            >
              Để sau
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
