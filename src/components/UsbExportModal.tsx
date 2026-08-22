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
    if (!selectedDrive) {
      setErrorMsg(language === 'tr' ? 'Lütfen bir USB sürücüsü seçin.' : 'Please select a USB drive.');
      return;
    }

    setIsCopying(true);
    setErrorMsg(null);

    try {
      await api.startUsbExport({
        tracks,
        targetDrive: selectedDrive,
        createSubfolder,
        subfolderName: createSubfolder ? subfolderName : undefined,
        carAudioPreset,
        skipExisting,
      });
    } catch (err: any) {
      setIsCopying(false);
      setErrorMsg(err.message || 'USB aktarımı başlatılamadı.');
    }
  };

  const handleCancelCopy = async () => {
    try {
      await api.cancelUsbExport();
      setIsCopying(false);
      onClose();
    } catch (err) {}
  };

  const handleOpenUsbFolder = () => {
    if (resultData?.destinationFolder) {
      api.openFolder(resultData.destinationFolder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-['Roboto','YouTube_Sans']">
      <div className="relative w-full max-w-lg bg-[#212121] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#181818] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#3ea6ff]">
              <Usb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t.usbModalTitle}</h3>
              <p className="text-[11px] text-[#aaaaaa]">
                {tracks.length} {t.tracks} • {selectedDrive || 'USB Seçin'}
              </p>
            </div>
          </div>

          {!isCopying && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isComplete ? (
            /* Completed Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#2ba640]/20 border border-[#2ba640]/30 flex items-center justify-center text-[#2ba640] mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-white">{t.usbSuccessTitle}</h4>
                <p className="text-xs text-[#aaaaaa] max-w-sm mx-auto leading-relaxed">
                  {resultData?.copiedCount || tracks.length} parça başarıyla USB belleğinize aktarıldı ve araç teypleriyle uyumlu hale getirildi.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={handleOpenUsbFolder}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-[#3ea6ff]" />
                  <span>USB Klasörünü Aç</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-white text-[#0f0f0f] hover:bg-[#e5e5e5] rounded-full text-xs font-semibold transition-all cursor-pointer"
                >
                  {t.usbClose}
                </button>
              </div>
            </div>
          ) : isCopying ? (
            /* Active Copying Progress View */
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Usb className="w-4 h-4 text-[#3ea6ff] animate-pulse" />
                  <span>{t.usbCopying}</span>
                </span>
                <span className="font-mono text-[#aaaaaa]">
                  {progress?.currentTrackIndex || 0} / {tracks.length} (%{progress?.percent || 0})
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-[#181818] rounded-full overflow-hidden border border-white/10 relative">
                <div
                  className="h-full bg-[#ff0000] rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, progress?.percent || 5)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#aaaaaa]">
                <span className="truncate max-w-xs text-white font-medium">
                  {progress?.currentFileName || 'Hazırlanıyor...'}
                </span>
                <span className="flex items-center gap-1 text-[#3ea6ff] shrink-0 font-semibold">
                  <Gauge className="w-3 h-3" />
                  {progress?.speedFormatted || 'Hesaplanıyor...'}
                </span>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={handleCancelCopy}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#ff4e45] rounded-full text-xs font-semibold transition-colors cursor-pointer"
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
                  <label className="text-xs font-medium text-[#aaaaaa] flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#3ea6ff]" />
                    <span>{t.usbSelectDrive}</span>
                  </label>

                  <button
                    onClick={fetchDrives}
                    disabled={isLoadingDrives}
                    className="text-[11px] text-[#3ea6ff] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className={`w-3 h-3 ${isLoadingDrives ? 'animate-spin' : ''}`} />
                    <span>{t.usbRefresh}</span>
                  </button>
                </div>

                {drives.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 text-[#aaaaaa] text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#ff4e45] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{t.usbNoDrives}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedDrive}
                      onChange={(e) => setSelectedDrive(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono cursor-pointer"
                    >
                      {drives.map((d) => (
                        <option key={d.driveLetter} value={d.driveLetter}>
                          {d.driveLetter} [{d.label}] ({d.freeSpaceFormatted} Boş / {d.totalSizeFormatted}) - {d.fileSystem}
                        </option>
                      ))}
                    </select>

                    {currentDriveObj && (
                      <div className="p-2.5 rounded-xl bg-[#181818] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-[#aaaaaa] font-mono">
                          <span>{currentDriveObj.label} ({currentDriveObj.driveLetter})</span>
                          <span>{currentDriveObj.freeSpaceFormatted} Boş / {currentDriveObj.totalSizeFormatted}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3ea6ff] rounded-full"
                            style={{ width: `${currentDriveObj.percentUsed}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subfolder Toggle */}
              <div className="space-y-2 p-3 bg-[#181818] rounded-xl border border-white/5">
                <label className="flex items-center gap-2.5 text-xs text-[#f1f1f1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createSubfolder}
                    onChange={(e) => setCreateSubfolder(e.target.checked)}
                    className="w-4 h-4 accent-[#ff0000] rounded"
                  />
                  <div className="flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-[#3ea6ff]" />
                    <span>{t.usbCreateFolder}</span>
                  </div>
                </label>

                {createSubfolder && (
                  <input
                    type="text"
                    value={subfolderName}
                    onChange={(e) => setSubfolderName(e.target.value)}
                    placeholder={t.usbFolderPlaceholder}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                )}
              </div>

              {/* Car Audio Preset Toggle */}
              <div className="p-3 bg-[#181818] border border-white/5 rounded-xl space-y-1">
                <label className="flex items-center gap-2.5 text-xs text-white font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carAudioPreset}
                    onChange={(e) => setCarAudioPreset(e.target.checked)}
                    className="w-4 h-4 accent-[#ff0000] rounded"
                  />
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-[#3ea6ff]" />
                    <span>{t.usbCarAudioPreset}</span>
                  </div>
                </label>
                <p className="text-[10px] text-[#aaaaaa] pl-6 leading-relaxed">
                  {t.usbCarAudioDesc}
                </p>
              </div>

              {/* Skip Existing Toggle */}
              <label className="flex items-center gap-2.5 text-xs text-[#aaaaaa] cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="w-4 h-4 accent-[#ff0000] rounded"
                />
                <span>{t.usbSkipExisting}</span>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#181818] border border-[#ff4e45]/30 text-[#ff4e45] text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartCopy}
                  disabled={drives.length === 0 || !selectedDrive}
                  className="w-full py-3 px-4 rounded-full bg-[#f1f1f1] hover:bg-white disabled:opacity-40 text-[#0f0f0f] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
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
