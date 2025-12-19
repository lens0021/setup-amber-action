# setup-amber

[![Linter](https://github.com/lens0021/setup-amber/actions/workflows/linter.yaml/badge.svg)](https://github.com/lens0021/setup-amber/actions/workflows/linter.yaml)
[![Test](https://github.com/lens0021/setup-amber/actions/workflows/test.yaml/badge.svg)](https://github.com/lens0021/setup-amber/actions/workflows/test.yaml)

GitHub Actions for setting up [Amber] compiler.

This action downloads and installs the Amber compiler binary, making it available for subsequent steps in your workflow.

> [!NOTE]
> This is a [composite action] because I want less maintaining costs.
> There is a limitation of composite action itself:
>
> - Name of steps are not displayed. ([GitHub discussion](https://github.com/orgs/community/discussions/10985))

## Usage

See [action.yaml](action.yaml)

<!-- start usage -->

```yaml
- uses: lens0021/setup-amber@v1
  with:
    # The Amber version to install.
    # Examples: 0.4.0-alpha, 0.5.0-alpha
    # Default: 0.5.1-alpha
    amber-version: ""

    # Whether to cache Amber binaries
    # Default: true
    enable-cache: ""

    # The path to store Amber binaries.
    # If empty string is given, the used path depends on the runner.
    # Default (Linux): '/home/runner/.setup-amber'
    # Default (Mac): '/Users/runner/.setup-amber'
    cache-path: ""
```

<!-- end usage -->

### Outputs

- `amber-path`: The path where the Amber binary was installed.

### Example workflow

**Basic usage:**

```yaml
name: Build with Amber

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Setup Amber
        uses: lens0021/setup-amber@v1
        with:
          amber-version: 0.4.0-alpha

      - name: Compile Amber script
        run: amber script.ab
```

**With custom cache path:**

```yaml
- uses: lens0021/setup-amber@v1
  with:
    amber-version: 0.4.0-alpha
    cache-path: /tmp/amber-cache
```

**Using outputs:**

```yaml
- name: Setup Amber
  id: setup-amber
  uses: lens0021/setup-amber@v2
  with:
    amber-version: 0.5.1-alpha

- name: Display installed path
  run: echo "Amber installed at ${{ steps.setup-amber.outputs.amber-path }}"
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

[amber]: https://amber-lang.com/
[composite action]: https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action
