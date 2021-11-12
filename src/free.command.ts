import { DirectoryScanner } from './directory-scanner';
import { CommandModule } from 'yargs';
import { SpaceCalculator } from './space-calculator';
import byteSize from 'byte-size';

interface CommandArgs {
  path: string;
  reserve: string;
  delete: boolean;
  watch: boolean;
}

export class FreeCommand {
  private scanner?: DirectoryScanner;
  private calc?: SpaceCalculator;

  public async run(args: CommandArgs) {
    this.calc = await SpaceCalculator.fromString(args.path, args.reserve);

    console.log('===> Scanning %s', args.path);
    this.scanner = new DirectoryScanner(args.path, args.watch).on('stat', this.printStat.bind(this));
    await this.scanner.scan();
  }

  private async printStat(stat: { count: number; size: number }) {
    console.log(
      '[%d] files, [%s] used, [%s] avg',
      stat.count,
      byteSize(stat.size),
      byteSize(stat.size / (0 == stat.count ? 1 : stat.count))
    );

    if (undefined !== this.calc) {
      const bytesToFree = await this.calc.bytesToFree();
      console.log('Need to free [%s]', byteSize(bytesToFree));

      const candidates = this.scanner?.collectCandidates(bytesToFree) ?? [];
      console.log(candidates);

      for (const candidate of candidates) {
        console.log(
          '   > Deleting %s [%s] from %s',
          candidate.path,
          byteSize(candidate.stat.size),
          candidate.stat.ctime.toISOString()
        );
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
