import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  findNodeHandle,
  NativeModules,
} from 'react-native';
import { mediaDevices } from 'react-native-webrtc';
import type { RootStackParamList } from '../App';
import { useEffect, useState } from 'react';
import { RoomControls } from './RoomControls';
import { ParticipantView } from './ParticipantView';
import { useRoom, useParticipant, AudioSession } from 'livekit-react-native';
import { Participant, Room, Track, createLocalVideoTrack } from 'livekit-client';
import type { TrackPublication } from 'livekit-client';
import { Platform } from 'react-native';
import { ScreenCapturePickerView } from 'react-native-webrtc';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () =>
      new Room({
        publishDefaults: { simulcast: false },
        adaptiveStream: true,
      })
  );
  const { participants } = useRoom(room);
  const { url, token } = route.params;

  // Connect to room.
  useEffect(() => {
    let connect = async () => {
      // If you wish to configure audio, uncomment the following:
      // await AudioSession.configureAudio({
      //   android: {
      //     preferredOutputList: ["earpiece"]
      //   },
      //   ios: {
      //     defaultOutput: "earpiece"
      //   }
      // });
      await AudioSession.startAudioSession();
      await room.connect(url, token, {});
      await fireOnce();
      console.log('connected to ', url, ' ', token);
      setIsConnected(true);
    };

    connect();
    return () => {
      room.disconnect();
      AudioSession.stopAudioSession();
    };
  }, [url, token, room]);

  useEffect(() => {
    const ps = participants.filter(el => !el.isLocal).map(p => ({
        isLocal: p.isLocal,
        // isCameraEnabled: p.isCameraEnabled,
        trackIsEnabled: p.getTrack(Track.Source.Camera)?.isEnabled,
        trackIsSubbed: p.getTrack(Track.Source.Camera)?.isSubscribed,
        joinedAt: p.joinedAt
    }))
    console.log(`the other participant ${Platform.OS}`, ps);
}, [participants]);

const fireOnce = async () => {
    const devices = await mediaDevices.enumerateDevices()
    const videoTrack = await createLocalVideoTrack({
        // @ts-ignore
        facingMode: devices.facing, // device object from mediaDevices.enumerateDevices()
    });
    await room.localParticipant.publishTrack(videoTrack);

}

  // Setup views.
  const stageView = participants.length > 0 && (
    <ParticipantView participant={participants[0]} style={styles.stage} />
  );

  const renderParticipant: ListRenderItem<Participant> = ({ item }) => {
    return (
      <ParticipantView participant={item} style={styles.otherParticipantView} />
    );
  };

  const otherParticipantsView = participants.length > 0 && (
    <FlatList
      data={participants}
      renderItem={renderParticipant}
      keyExtractor={(item) => item.sid}
      horizontal={true}
      style={styles.otherParticipantsList}
    />
  );

  const { cameraPublication, microphonePublication, screenSharePublication } =
    useParticipant(room.localParticipant);

  // Prepare for iOS screenshare.
  const screenCaptureRef = React.useRef(null);
  const screenCapturePickerView = Platform.OS === 'ios' && (
    <ScreenCapturePickerView ref={screenCaptureRef} />
  );
  const startBroadcast = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      room.localParticipant.setScreenShareEnabled(true);
    } else {
      room.localParticipant.setScreenShareEnabled(true);
    }
  };

  return (
    <View style={styles.container}>
      {stageView}
      {otherParticipantsView}
      <RoomControls
        micEnabled={isTrackEnabled(microphonePublication)}
        setMicEnabled={(enabled: boolean) => {
          room.localParticipant.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={isTrackEnabled(cameraPublication)}
        setCameraEnabled={(enabled: boolean) => {
          room.localParticipant.setCameraEnabled(enabled);
        }}
        screenShareEnabled={isTrackEnabled(screenSharePublication)}
        setScreenShareEnabled={(enabled: boolean) => {
          if (enabled) {
            startBroadcast();
          } else {
            room.localParticipant.setScreenShareEnabled(enabled);
          }
        }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
      {screenCapturePickerView}
    </View>
  );
};

function isTrackEnabled(pub?: TrackPublication): boolean {
  return !(pub?.isMuted ?? true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
  },
  otherParticipantsList: {
    width: '100%',
    height: 150,
    flexGrow: 0,
  },
  otherParticipantView: {
    width: 150,
    height: 150,
  },
});
