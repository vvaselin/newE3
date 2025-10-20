'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Select from 'react-select';

const qrcodeRegionId = 'html5qr-code-full-region';

export default function QrcodeReader({ onScanSuccess, onScanFailure }: { onScanSuccess: any; onScanFailure: any }) {
  const [mounted, setMounted] = useState(false); // クライアントマウント済みフラグ
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const config = { fps: 1, qrbox: { width: 400, height: 400 } };

  useEffect(() => {
    setMounted(true); // クライアントでマウントされたことを検知
  }, []);

  useEffect(() => {
    if (!mounted) return; // SSR 時は何もしない
    if (!onScanSuccess || !onScanFailure) throw 'required callback';

    // DOM 内の古い要素をクリア
    const container = document.getElementById(qrcodeRegionId);
    if (container) while (container.firstChild) container.removeChild(container.firstChild);

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(qrcodeRegionId);

      // カメラ取得と自動スキャン
      Html5Qrcode.getCameras()
        .then((cameraList) => {
          if (cameraList && cameraList.length) {
            const formattedCameras = cameraList.map((cam) => ({
              value: cam.id,
              label: cam.label || `Camera ${cam.id}`,
            }));
            setCameras(formattedCameras);
            const defaultId = formattedCameras[0].value;
            setSelectedCameraId(defaultId);
            scannerRef.current?.start(defaultId, config, onScanSuccess, onScanFailure);
          } else {
            console.warn('カメラが見つかりませんでした');
          }
        })
        .catch((err) => console.error(err));
    }

    return () => {
      scannerRef.current?.stop().finally(() => scannerRef.current?.clear());
    };
  }, [mounted, onScanSuccess, onScanFailure]);

  if (!mounted) return null; // SSR では何も描画しない

  return (
    <div className="container mx-auto">
      <div className="max-w-screen-lg" id={qrcodeRegionId} />
      <div>
        {cameras.length > 0 ? (
          <Select
            name="camera"
            options={cameras}
            value={cameras.find((c) => c.value === selectedCameraId)}
            placeholder="カメラを選択"
            onChange={async (camera) => {
              if (!scannerRef.current) return;
              await scannerRef.current.stop();
              setSelectedCameraId(camera.value);
              await scannerRef.current.start(camera.value, config, onScanSuccess, onScanFailure);
            }}
          />
        ) : (
          <p>カメラがありません</p>
        )}
      </div>
    </div>
  );
}

