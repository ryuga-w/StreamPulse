import React, { useState, useEffect } from 'react';
import { DownloadItem, UsbDriveInfo, UsbCopyProgress, Language } from '../types';
import { api } from '../api';
import { translations } from '../i18n';
import confetti from 'canvas-confetti';
import {
  HardDrive,
  Usb,
  RotateCw,
  FolderPlus,
  Car,
  CheckCircle2,
  X,
  Gauge,
  Sparkles,
  FolderOpen,
  AlertCircle,
} from 'lucide-react';

interface UsbExportModalProps {
  tracks: DownloadItem[];
  defaultFolderName?: string;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const UsbExportModal: React.FC<UsbExportModalProps> = ({
  tracks,
  defaultFolderName = '',
  isOpen,
  onClose,
  language = 'tr',
}) => {
  const [drives, setDrives] = useState<UsbDriveInfo[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<string>('');
  const [isLoadingDrives, setIsLoadingDrives] = useState(false);
  const [createSubfolder, setCreateSubfolder] = useState(true);
  const [subfolderName, setSubfolderName] = useState(defaultFolderName);
  const [carAudioPreset, setCarAudioPreset] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);

  const [isCopying, setIsCopying] = useState(false);
  const [progress, setProgress] = useState<UsbCopyProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [resultData, setResultData] = useState<{ destinationFolder?: string; copiedCount?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = translations[language];

  const fetchDrives = async () => {
    setIsLoadingDrives(true);
    try {
      const list = await api.getUsbDrives();
      setDrives(list);
      if (list.length > 0 && (!selectedDrive || !list.some((d) => d.driveLetter === selectedDrive))) {
        setSelectedDrive(list[0].driveLetter);
      }
    } catch (e) {
      setDrives([]);
    } finally {
      setIsLoadingDrives(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrives();
      setSubfolderName(defaultFolderName);
      setIsCopying(false);
      setProgress(null);
      setIsComplete(false);
      setErrorMsg(null);
    }
  }, [isOpen, defaultFolderName]);

  useEffect(() => {
    if (!isOpen) return;

    const cleanup = api.subscribeToEvents({
      onProgress: () => {},
      onComplete: () => {},
      onError: () => {},
      onUsbProgress: (prog) => {
        setProgress(prog);
      },
      onUsbComplete: (res) => {
        setIsCopying(false);
        setIsComplete(true);
        setResultData(res);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      },
    });

    return cleanup;
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDriveObj = drives.find((d) => d.driveLetter === selectedDrive);

  const handleStartCopy = async () => {
    if (!selectedDrive) return;
    setIsCopying(true);
    setIsComplete(false);
    setErrorMsg(null);

    try {
      const res = await api.copyToUsb({
        tracks,
        targetDrive: selectedDrive,
        subfolderName: createSubfolder ? subfolderName : undefined,
        carAudioPreset,
        skipExisting,
      });

      if (!res.success && res.error) {
        setIsCopying(false);
        setErrorMsg(res.error);
      }
    } catch (e: any) {
      setIsCopying(false);
      setErrorMsg(e.message || 'Kopyalama başlatılamadı.');
    }
  };

  const handleCancelCopy = () => {
    api.cancelUsbCopy();
    setIsCopying(false);
  };

  const handleOpenUsbFolder = () => {
    if (resultData?.destinationFolder) {
      api.openFolder(resultData.destinationFolder);
    } else if (selectedDrive) {
      api.openFolder(selectedDrive + '\\');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="usb-modal-card relative w-full max-w-lg bg-[#0c1222] border border-purple-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="usb-modal-header p-4 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-glow-purple">
              <Usb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="modal-title text-xs font-bold text-white leading-none">{t.usbModalTitle}</h3>
              <p className="modal-subtitle text-[10px] text-purple-300 mt-1 font-mono">
                {tracks.length} {t.tracks}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isCopying}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Completed View */}
          {isComplete ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="modal-title text-base font-bold text-white">{t.usbCompleteTitle}</h4>
                <p className="modal-desc text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {resultData?.copiedCount || tracks.length} {t.tracks} {t.usbCompleteDesc}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleOpenUsbFolder}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow-purple transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{t.usbOpenDrive}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t.usbClose}
                </button>
              </div>
            </div>
          ) : isCopying ? (
            /* Active Copying Progress View */
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-400 flex items-center gap-2">
                  <Usb className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>{t.usbCopying}</span>
                </span>
                <span className="font-mono text-slate-400">
                  {progress?.currentTrackIndex || 0} / {tracks.length} ({progress?.percent || 0}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 relative p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 rounded-full transition-all duration-200 shadow-glow-purple relative overflow-hidden"
                  style={{ width: `${Math.min(100, progress?.percent || 5)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-xs modal-title text-white font-medium">
                  {progress?.currentFileName || 'Hazırlanıyor...'}
                </span>
                <span className="flex items-center gap-1 text-purple-400 shrink-0 font-bold">
                  <Gauge className="w-3 h-3" />
                  {progress?.speedFormatted || 'Hesaplanıyor...'}
                </span>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={handleCancelCopy}
                  className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  İptal Et
                </button>
              </div>
            </div>
          ) : (
            /* Configuration & Drive Selection View */
            <>
              {/* Drive Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="modal-label text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-500" />
                    <span>{t.usbSelectDrive}</span>
                  </label>

                  <button
                    onClick={fetchDrives}
                    disabled={isLoadingDrives}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className={`w-3 h-3 ${isLoadingDrives ? 'animate-spin' : ''}`} />
                    <span>{t.usbRefresh}</span>
                  </button>
                </div>

                {drives.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{t.usbNoDrives}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedDrive}
                      onChange={(e) => setSelectedDrive(e.target.value)}
                      className="usb-select w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
                    >
                      {drives.map((d) => (
                        <option key={d.driveLetter} value={d.driveLetter}>
                          {d.driveLetter} [{d.label}] ({d.freeSpaceFormatted} Boş / {d.totalSizeFormatted}) - {d.fileSystem}
                        </option>
                      ))}
                    </select>

                    {currentDriveObj && (
                      <div className="usb-drive-bar p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{currentDriveObj.label} ({currentDriveObj.driveLetter})</span>
                          <span>{currentDriveObj.freeSpaceFormatted} Boş / {currentDriveObj.totalSizeFormatted}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${currentDriveObj.percentUsed}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subfolder Toggle */}
              <div className="usb-config-box space-y-2 p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <label className="modal-label flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createSubfolder}
                    onChange={(e) => setCreateSubfolder(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <div className="flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-purple-500" />
                    <span>{t.usbCreateFolder}</span>
                  </div>
                </label>

                {createSubfolder && (
                  <input
                    type="text"
                    value={subfolderName}
                    onChange={(e) => setSubfolderName(e.target.value)}
                    placeholder={t.usbFolderPlaceholder}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>

              {/* Car Audio Preset Toggle */}
              <div className="usb-car-box p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-1">
                <label className="flex items-center gap-2.5 text-xs text-purple-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carAudioPreset}
                    onChange={(e) => setCarAudioPreset(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-purple-400" />
                    <span>{t.usbCarAudioPreset}</span>
                  </div>
                </label>
                <p className="modal-desc text-[10px] text-slate-400 pl-6 leading-relaxed">
                  {t.usbCarAudioDesc}
                </p>
              </div>

              {/* Skip Existing Toggle */}
              <label className="modal-label flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <span>{t.usbSkipExisting}</span>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartCopy}
                  disabled={drives.length === 0 || !selectedDrive}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold text-xs shadow-glow-purple flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Usb className="w-4 h-4" />
                  <span>{t.usbStartCopy} ({tracks.length} {t.tracks})</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
