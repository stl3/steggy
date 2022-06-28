import Editor from '@monaco-editor/react';
import { HALF, is, SECOND, sleep } from '@steggy/utilities';
import { Alert, Space, Spin, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { FD_ICONS, sendRequest } from '../../types';
import { CodeCommandHelp } from './CodeCommandHelp';
let timeout: NodeJS.Timeout;

export function TypedEditor(props: {
  code: string;
  defaultValue?: string;
  extraTypes?: string;
  onUpdate: (update: string) => void;
  secondaryText?: string | JSX.Element;
  type?: 'request' | 'execute';
}) {
  const [extraTypes, setExtraTypes] = useState<string>('');
  const [forceHide, setForceHide] = useState<boolean>(false);
  const [code, setCode] = useState<string>(props.code);

  // ? Is there may be a better way to accomplish this effect?
  // Updating `extraTypes` means the editor needs an update
  useEffect(() => {
    async function refresh() {
      setForceHide(true);
      await sleep(0);
      setForceHide(false);
    }
    refresh();
  }, [props.extraTypes]);

  useEffect(() => {
    async function loadTypes() {
      const { types } = await sendRequest<{ types: string }>({
        url: `/debug/editor-types`,
      });
      setExtraTypes(types);
    }
    loadTypes();
  }, []);

  function sendUpdate(update: string): void {
    setCode(update);
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => props.onUpdate(update), HALF * HALF * SECOND);
  }

  // The race condition stopper
  if (forceHide || is.empty(extraTypes)) {
    return (
      <Spin tip="Loading...">
        <Alert
          message="Loading definitions"
          description="Capturing from the current system state"
          type="info"
        />
      </Spin>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <Typography.Text type="secondary">
          {props.secondaryText}
        </Typography.Text>
        <span style={{ float: 'right' }}>
          {(props.type ?? 'request') === 'request' ? (
            <Tooltip
              placement="left"
              title="Code must return a value to be understood"
            >
              {/* TODO: Click to hide / never show again. Tracked against `person` profile */}
              {/* Only if it bothers me enough to make a ticket */}
              {FD_ICONS.get('information')}
            </Tooltip>
          ) : (
            <CodeCommandHelp />
          )}
        </span>
      </div>
      <Editor
        theme="vs-dark"
        height="50vh"
        value={code ?? ''}
        beforeMount={({ languages: { typescript } }) => {
          typescript.typescriptDefaults.setDiagnosticsOptions(
            // ? 1108 = top level return
            // This is needed because we are only typing the function body, not a whole file
            //
            // ? 1375 = top level await
            // ? 1378 = related compiler complaining
            // This isn't really "top level", these aren't relevant
            { diagnosticCodesToIgnore: [1108, 1375, 1378] },
          );
          typescript.typescriptDefaults.setExtraLibs([
            {
              content:
                extraTypes +
                (props.extraTypes ?? '') +
                (props.type === 'execute'
                  ? [
                      `/**`,
                      ` * Execute function to stop routine execution`,
                      ` */`,
                      `declare const stop_processing: () => void;`,
                      `declare const cacheManager: iCacheManager;`,
                      `declare const steggy: iVMBreakoutAPI;`,
                    ].join(`\n`)
                  : ''),
              filePath: 'dynamic-types.d.ts',
            },
          ]);
        }}
        options={{ minimap: { enabled: false } }}
        onChange={value => sendUpdate(value)}
        defaultLanguage="typescript"
        defaultValue={props.defaultValue}
      />
    </Space>
  );
}
