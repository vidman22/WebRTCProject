import * as React from 'react';

import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PreJoinPage } from './src/PreJoinPage';
import { RoomPage } from './src/RoomPage';
import MLCamera from './src/MLCamera';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator>
        <Stack.Screen name="PreJoinPage" component={PreJoinPage} />
        <Stack.Screen name='MLCamera' component={MLCamera} />
        <Stack.Screen name="RoomPage" component={RoomPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type RootStackParamList = {
  PreJoinPage: undefined;
  RoomPage: { url: string; token: string };
  MLCamera: undefined;
};