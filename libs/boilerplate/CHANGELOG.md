# Changelog

## 0.11.6

- Config metadata can now be provided inline with the @InjectConfig for applications now
  - `@InjectConfig('PROPERTY', { description: 'lorem ipsum' }) ...`
- Config sanity check is performed at boot now
  - Warnings are emitted for `warnDefault`
  - Application will emit fatal log message + exit on `required` properties not being provided

## 0.11.5

- In case of multiple similar environment variables being passed (`BASE_URL` vs `base_url`), an exact match to the expected case will be prioritized

## 0.11.4

- Config scanning functionality resurrected
  - Calling `ScanConfig` with a reference to the `INestApplication` will return an object that represents a deduplicated list of all injected configuration definition.
  - `@QuickScript` now looks for `--config-scanner` command line switch. If passed, a config scan will be performed with the results being output to the console instead of running the script.
- `WorkspaceService` now provides the functionality of loading configs from files
- Command line switches now properly take priority over environment variables
- Command line switches and environment variables are now case insensitive (dashes and underscores are interchangable also)

## 0.10.28

- Boilerplate: `@QuickScript` can now take in bootstrap options to pass through.
  - Enables `NestJS` & `@steggy/server` modules for microservice creation