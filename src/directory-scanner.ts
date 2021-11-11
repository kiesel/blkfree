import { Stats } from 'fs';
import { FileSpy, filespy } from 'filespy';
import byteSize from 'byte-size';

export interface FileRef {
  path: string;
  stat: Stats;
}

export class DirectoryScanner {
  private files = new Map<string, Stats>();
  private size = 0;
  private fileCount = 0;
  private ready = false;
  private spy?: FileSpy;

  constructor(private path: string, private watch = true) {}

  public async scan() {
    console.log('===> Scanning %s', this.path);

    this.spy = filespy(this.path)
      .on('all', this.fileEvent.bind(this))
      .on('ready', () => {
        console.log('---> Initial scan completed.');
        this.ready = true;
        this.printUsage();
        this.freeBlocks();

        if (!this.watch) {
          this.shutdown();
        }
      });
  }

  public async shutdown(): Promise<void> {
    return this.spy?.close();
  }

  private fileEvent(event: any, name: string, stats: Stats | null, cwd: string): void {
    switch (event) {
      case 'create':
      case 'update': {
        if (null === stats) {
          console.error('No stats for %s - ignoring...', name);
          break;
        }
        this.addFile(name, stats);

        break;
      }

      case 'delete': {
        this.removeFile(name);
        break;
      }
    }

    if (this.ready) {
      this.printUsage();
      this.freeBlocks();
    }
  }

  private addFile(path: string, stats: Stats) {
    const existing = this.files.get(path);

    this.files.set(path, stats);

    this.size += stats.size - (existing?.size ?? 0);
    this.fileCount += 1 - (undefined === existing ? 0 : 1);
  }

  private removeFile(path: string) {
    const stat = this.files.get(path);
    if (undefined === stat) {
      console.error('No information for removal of %s - ignoring.', path);
      return;
    }

    this.files.delete(path);
    this.fileCount -= 1;
    this.size -= stat.size;
  }

  private printUsage() {
    console.log(
      '[%d] files, [%s] used, [%s] avg',
      this.fileCount,
      byteSize(this.size),
      byteSize(this.size / (0 == this.fileCount ? 1 : this.fileCount))
    );
  }

  private sortedFileList(): FileRef[] {
    const files: FileRef[] = [];
    for (const [path, stat] of this.files) {
      files.push({ path, stat });
    }

    return files.sort((a, b) => (a.stat.ctimeMs < b.stat.ctimeMs ? 1 : -1));
  }

  public collectCandidates(freeBytes: number): FileRef[] {
    const candidates: FileRef[] = [];
    for (const file of this.sortedFileList()) {
      if (freeBytes <= 0) {
        break;
      }

      candidates.push(file);
    }

    return candidates;
  }

  private freeBlocks() {}
}
