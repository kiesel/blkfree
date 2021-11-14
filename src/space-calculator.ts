import byteSize from 'byte-size';
import { check } from 'diskusage';

export class SpaceCalculator {
  constructor(private path: string, private bytesToReserve: number) {}

  public static async fromString(path: string, input: string): Promise<SpaceCalculator> {
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
      '%': async (bytes: number) => await SpaceCalculator.calculatePercent(path, Number(size)),
    };

    if (undefined === calculators[unit.toUpperCase()]) {
      throw new Error('Malformed input');
    }

    bytes = await calculators[unit.toUpperCase()](Number(size));

    console.log('---> Reserving [%s] on %s', byteSize(bytes), path);
    return new SpaceCalculator(path, bytes);
  }

  public reservedBytes() {
    return this.bytesToReserve;
  }

  public async bytesToFree() {
    return Math.max(0, this.bytesToReserve - (await this.availableBytes()));
  }

  public async availableBytes() {
    return (await check(this.path)).available;
  }

  public async totalBytes() {
    return (await check(this.path)).total;
  }

  private static async calculatePercent(path: string, percent: number): Promise<number> {
    const diskusage = await check(path);
    return Math.floor((diskusage.total * percent) / 100);
  }
}
