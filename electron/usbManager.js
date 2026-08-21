const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class UsbManager {
  constructor() {
    this.activeCopyCancelled = false;
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  cleanCarAudioFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();
  }

  async getUsbDrives() {
    return new Promise((resolve) => {
      const psCommand = `Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, DriveType, FileSystem, FreeSpace, Size | ConvertTo-Json`;

      exec(`powershell -NoProfile -Command "${psCommand}"`, { windowsHide: true }, (err, stdout) => {
        if (err || !stdout.trim()) {
          return resolve([]);
        }

        try {
          let data = JSON.parse(stdout);
          if (!Array.isArray(data)) {
            data = data ? [data] : [];
          }

          const drives = data
            .filter((d) => d.DeviceID && (d.DriveType === 2 || (d.DriveType === 3 && d.DeviceID !== 'C:')))
            .map((d) => {
              const totalSize = parseInt(d.Size, 10) || 0;
              const freeSpace = parseInt(d.FreeSpace, 10) || 0;
              const usedSpace = totalSize - freeSpace;
              const percentUsed = totalSize > 0 ? (usedSpace / totalSize) * 100 : 0;

              return {
                driveLetter: d.DeviceID,
                label: d.VolumeName || (d.DriveType === 2 ? 'USB Flash Bellek' : 'Harici Disk'),
                fileSystem: d.FileSystem || 'FAT32',
                isRemovable: d.DriveType === 2,
                freeSpaceBytes: freeSpace,
                totalSizeBytes: totalSize,
                freeSpaceFormatted: this.formatBytes(freeSpace),
                totalSizeFormatted: this.formatBytes(totalSize),
                percentUsed: parseFloat(percentUsed.toFixed(1)),
              };
            });

          resolve(drives);
        } catch (e) {
          resolve([]);
        }
      });
    });
  }

  /**
   * Find actual distinct files to copy
   */
  resolveSourceFiles(tracks) {
    const filesToCopy = new Set();
    const mediaExts = ['.mp3', '.m4a', '.flac', '.wav', '.mp4', '.webm', '.mkv'];

    for (let idx = 0; idx < tracks.length; idx++) {
      const track = tracks[idx];
      const source = track.outputFile;
      if (!source) continue;

      const resolved = path.resolve(source);
      if (!fs.existsSync(resolved)) continue;

      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) {
        filesToCopy.add(resolved);
      } else {
        // Source is a directory -> get all media files in this directory
        try {
          const dirFiles = fs.readdirSync(resolved);
          for (const f of dirFiles) {
            const ext = path.extname(f).toLowerCase();
            if (mediaExts.includes(ext)) {
              filesToCopy.add(path.join(resolved, f));
            }
          }
        } catch (e) {}
      }
    }

    return Array.from(filesToCopy);
  }

  async copyTracksToUsb({
    tracks,
    targetDrive,
    subfolderName,
    carAudioPreset = true,
    skipExisting = false,
    onProgress,
    onComplete,
    onError,
  }) {
    this.activeCopyCancelled = false;

    if (!tracks || tracks.length === 0) {
      return onError?.(new Error('Kopyalanacak parça bulunamadı.'));
    }

    if (!targetDrive || !fs.existsSync(targetDrive + '\\')) {
      return onError?.(new Error(`Hedef sürücü (${targetDrive}) bulunamadı veya çıkarıldı.`));
    }

    // Resolve all distinct media files from tracks and folders
    const actualFiles = this.resolveSourceFiles(tracks);

    if (actualFiles.length === 0) {
      return onError?.(new Error('Kaynak klasörde kopyalanabilecek MP3 / MP4 dosyası bulunamadı.'));
    }

    let destDir = targetDrive + '\\';
    if (subfolderName) {
      const cleanFolder = this.cleanCarAudioFilename(subfolderName);
      destDir = path.join(destDir, cleanFolder);
    }

    try {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
    } catch (e) {
      return onError?.(new Error(`USB üzerinde klasör oluşturulamadı: ${e.message}`));
    }

    const totalFiles = actualFiles.length;
    let completedCount = 0;
    let totalBytesCopied = 0;
    const startTime = Date.now();

    for (let i = 0; i < actualFiles.length; i++) {
      if (this.activeCopyCancelled) {
        return onError?.(new Error('Kopyalama kullanıcı tarafından iptal edildi.'));
      }

      const sourceFile = actualFiles[i];
      const originalFilename = path.basename(sourceFile);
      let targetFilename = originalFilename;

      if (carAudioPreset) {
        targetFilename = this.cleanCarAudioFilename(targetFilename);
      }

      const targetFilePath = path.join(destDir, targetFilename);

      if (skipExisting && fs.existsSync(targetFilePath)) {
        completedCount++;
        onProgress?.({
          currentTrackIndex: completedCount,
          totalTracks: totalFiles,
          currentFileName: targetFilename,
          percent: Math.round((completedCount / totalFiles) * 100),
          speedFormatted: 'Mevcut (Atlandı)',
        });
        continue;
      }

      try {
        const stats = fs.statSync(sourceFile);
        const fileSize = stats.size;

        // Perform fast copy
        await fs.promises.copyFile(sourceFile, targetFilePath);

        totalBytesCopied += fileSize;
        completedCount++;

        const elapsedSec = (Date.now() - startTime) / 1000;
        const avgSpeed = elapsedSec > 0 ? totalBytesCopied / elapsedSec : 0;

        onProgress?.({
          currentTrackIndex: completedCount,
          totalTracks: totalFiles,
          currentFileName: targetFilename,
          percent: Math.round((completedCount / totalFiles) * 100),
          speedFormatted: this.formatBytes(avgSpeed) + '/s',
        });
      } catch (err) {
        console.error('Copy error for file:', sourceFile, err);
        completedCount++;
      }
    }

    onComplete?.({
      success: true,
      copiedCount: completedCount,
      totalCount: totalFiles,
      destinationFolder: destDir,
    });
  }

  cancelCopy() {
    this.activeCopyCancelled = true;
  }
}

module.exports = new UsbManager();
