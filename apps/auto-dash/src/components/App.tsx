import * as eva from '@eva-design/eva';
import { NavigationContainer } from '@react-navigation/native';
import {
  ApplicationProvider,
  Button,
  Divider,
  IconRegistry,
  Layout,
} from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { STYLES } from '../styles';
import { AppNavigator } from './navigation.component';

export class App extends React.Component {
  // #region Public Methods

  public render(): JSX.Element {
    return (
      <>
        <IconRegistry icons={EvaIconsPack} />
        <ApplicationProvider {...eva} theme={eva.dark}>
          <SafeAreaView style={STYLES.safeArea}>
            <AppNavigator />
            <Divider />
            <NavigationContainer>
              <Layout style={STYLES.container}>
                <Button>OPEN DETAILS2</Button>
              </Layout>
            </NavigationContainer>
          </SafeAreaView>
        </ApplicationProvider>
      </>
    );
  }

  // #endregion Public Methods
}