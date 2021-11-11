import byteSize from 'byte-size';
import { check } from 'diskusage';

export class SpaceUnblocker {
  constructor(private path: string, private reservedBytes: number) {}

  public static async fromString(path: string, input: string): Promise<SpaceUnblocker> {
    const regexp = /^([0-9]+) ?([kmg%]?)/i;

    const matches = regexp.exec(input);
    if (null === matches) {
      throw new Error(`Malformed size directive: ${input}`);
    }

    let bytes: number;
    const [, size, unit] = matches;

    const calculators: { [k: string]: (bytes: number) => Promise<number> | number } = {
      G: (bytes: number) => bytes * 1024 * 1024 * 1024,
      M: (bytes: number) => bytes * 1024 * 1024,
      K: (bytes: number) => bytes * 1024,
      B: (bytes: number) => bytes,
      '%': async (bytes: number) => await SpaceUnblocker.calculatePercent(path, Number(size)),
    };

    if (undefined === calculators[unit.toUpperCase()]) {
      throw new Error('Malformed input');
    }

    bytes = await calculators[unit.toUpperCase()](Number(size));

    console.log('---> Reserving [%s] on %s', byteSize(bytes), path);
    return new SpaceUnblocker(path, bytes);
  }

  public async check() {
    const required = await this.requiredBytes();
    console.log('Need to free [%s]', byteSize(required));
  }

  private static async calculatePercent(path: string, percent: number): Promise<number> {
    const diskusage = await check(path);
    return Math.floor((diskusage.total * percent) / 100);
  }

  private async requiredBytes() {
    const diskusage = await check(this.path);
    return Math.max(0, this.reservedBytes - diskusage.available);
  }
}
