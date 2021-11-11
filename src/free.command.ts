import { DirectoryScanner } from './directory-scanner';
import { CommandModule } from 'yargs';
import { SpaceUnblocker } from './space-unblocker';

interface CommandArgs {
  path: string;
  reserve: string;
  delete: boolean;
  watch: boolean;
}

export class FreeCommand {
  public async run(args: CommandArgs) {
    const scanner = new DirectoryScanner(args.path, args.watch);
    await scanner.scan();

    const unblocker = await SpaceUnblocker.fromString(args.path, args.reserve);
    unblocker.check();
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
