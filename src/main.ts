import byteSize from 'byte-size';
import yargs from 'yargs';
import WatchCommand from './free.command';

byteSize.defaultOptions({ units: 'metric' });

yargs.scriptName('blkfree').command(WatchCommand).demandCommand(1).parse();
