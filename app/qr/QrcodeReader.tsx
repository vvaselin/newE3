'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Select from 'react-select';

const qrcodeRegionId = 'html5qr-code-full-region';

export default function QrcodeReader({
  onScanSuccess,
  onScanFailure,
}: {
  onScanSuccess: (result: string) => void;
  onScanFailure: (error: any) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameras, setCameras] = useState<{ value: string; label: string }[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const config = { fps: 10, qrbox: { width: 300, height: 300 } };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!onScanSuccess || !onScanFailure) throw new Error('Callback is required.');

    const container = document.getElementById(qrcodeRegionId);
    if (container) while (container.firstChild) container.removeChild(container.firstChild);

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(qrcodeRegionId);

      Html5Qrcode.getCameras()
        .then(async (cameraList) => {
          if (cameraList && cameraList.length > 0) {
            const formatted = cameraList.map((cam) => ({
              value: cam.id,
              label: cam.label || `Camera ${cam.id}`,
            }));
            setCameras(formatted);

            const defaultCam = formatted[0].value;
            setSelectedCameraId(defaultCam);

            try {
              await scannerRef.current?.start(defaultCam, config, onScanSuccess, onScanFailure);
            } catch (err) {
              console.error('スキャン開始エラー:', err);
            }
          } else {
            console.warn('カメラが見つかりません');
          }
        })
        .catch((err) => console.error('カメラ取得エラー:', err));
    }

    // 🔹 コンポーネントが破棄されるときのクリーンアップ
    return () => {
      const stopAndClear = async () => {
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop(); // ← stopが完了してからclear
            }
            await scannerRef.current.clear();
          } catch (err) {
            console.warn('Cleanup skipped:', err);
          }
        }
      };
      stopAndClear();
    };
  }, [mounted, onScanSuccess, onScanFailure]);

  if (!mounted) return null;

  return (
    <div className="container mx-auto">
      <div className="max-w-screen-lg" id={qrcodeRegionId} />
      <div className="mt-4">
        {cameras.length > 0 ? (
          <Select
            name="camera"
            options={cameras}
            value={cameras.find((c) => c.value === selectedCameraId)}
            placeholder="カメラを選択"
            onChange={async (camera) => {
              if (!camera || !scannerRef.current) return;
              try {
                if (scannerRef.current.isScanning) {
                  await scannerRef.current.stop();
                }
                setSelectedCameraId(camera.value);
                await scannerRef.current.start(camera.value, config, onScanSuccess, onScanFailure);
              } catch (err) {
                console.error('カメラ切替エラー:', err);
              }
            }}
          />
        ) : (
          <p>カメラが見つかりません。</p>
        )}
      </div>
    </div>
  );
}
