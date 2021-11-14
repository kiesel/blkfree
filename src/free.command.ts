import { DirectoryScanner } from './directory-scanner';
import { CommandModule } from 'yargs';
import { SpaceCalculator } from './space-calculator';
import byteSize from 'byte-size';
import { rm } from 'fs/promises';

interface CommandArgs {
  path: string;
  reserve: string;
  delete: boolean;
  watch: boolean;
}

export class FreeCommand {
  private scanner?: DirectoryScanner;
  private calc?: SpaceCalculator;

  private delete = false;

  public async run(args: CommandArgs) {
    this.delete = args.delete;
    this.calc = await SpaceCalculator.fromString(args.path, args.reserve);

    console.log('===> Scanning %s', args.path);
    this.scanner = new DirectoryScanner(args.path, args.watch).on('stat', this.printStat.bind(this));
    await this.scanner.scan();
  }

  private async printStat(stat: { count: number; size: number }) {
    if (undefined === this.calc || undefined === this.scanner) {
      return;
    }

    const bytesToFree = await this.calc.bytesToFree();

    if (bytesToFree <= 0) {
      return;
    }

    console.log(
      '   > [%d] files, [%s] used, [%s] avg',
      stat.count,
      byteSize(stat.size),
      byteSize(stat.size / (0 == stat.count ? 1 : stat.count))
    );

    console.log(
      '---> Total [%s], available [%s], need to free [%s]',
      byteSize(await this.calc.totalBytes()),
      byteSize(await this.calc.availableBytes()),
      byteSize(bytesToFree)
    );

    const candidates = this.scanner.collectCandidates(bytesToFree) ?? [];

    for (const candidate of candidates) {
      console.log(
        '   > Deleting %s [%s]\n     from %s\n',
        candidate.path,
        byteSize(candidate.stat.size),
        candidate.stat.ctime.toISOString()
      );

      if (this.delete) {
        await rm(this.scanner.fullPath(candidate.path), { recursive: false });
      }
    }
  }
}

export default {
  command: 'free',
  describe: 'Free space when required',
  builder: (yargs) =>
    yargs
      .option('path', { type: 'string', default: '.', describe: 'Path to check' })
      .option('reserve', { type: 'string', describe: 'When to free space (ie: "10%", "100M", "1G")', default: '100M' })
      .option('delete', { type: 'boolean', describe: 'Really delete files?', default: false })
      .option('watch', { type: 'boolean', default: false, describe: 'Run in continuous mode?' }),
  handler: (args) => new FreeCommand().run(args as any),
} as CommandModule;
