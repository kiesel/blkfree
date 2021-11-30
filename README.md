# blkfree

A program to keep directories / disks cleanup up - it frees blocks, thus the name.

## Getting started

You need:

- node >= 12
- yarn -> `npm install -g yarn`

Install project dependencies:

```
yarn install
```

... then build

```
yarn build
```

## Running

Currently, run it from the directory of the checkout via `yarn`:

```
$ yarn blkfree free --help
blkfree free

Free space when required

Options:
  --help     Show help                          [boolean]
  --version  Show version number                [boolean]
  --path     Path to check                      [string] [default: "."]
  --reserve  When to free space (ie: "10%", "100M", "1G")
                                                [string] [default: "100M"]
  --delete   Really delete files?               [boolean] [default: false]
  --watch    Run in continuous mode?            [boolean] [default: false]
```

## Example

```
yarn blkfree free --watch --reserve 100M --path ~/Downloads --delete
```

... deletes the oldest file in `~/Downloads` when free space on partition falls below 100MB. Runs in watch mode, ie. continuously monitors space, and actually deletes files (omit `--delete` to dry-run).
