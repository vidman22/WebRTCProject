import * as React from 'react';

import { StyleSheet, ViewStyle } from 'react-native';
import type { Participant } from 'livekit-client';
import { useParticipant, VideoView } from 'livekit-react-native';
import { View } from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
export type Props = {
  participant: Participant;
  style?: ViewStyle;
};
export const ParticipantView = ({ style = {}, participant }: Props) => {
  const { cameraPublication, screenSharePublication } =
    useParticipant(participant);
  let videoPublication = cameraPublication ?? screenSharePublication;

  const { colors } = useTheme();
  let videoView;
  if (
    videoPublication &&
    videoPublication.isSubscribed &&
    !videoPublication.isMuted
  ) {
    videoView = (
      <VideoView
        style={styles.videoView}
        videoTrack={videoPublication?.videoTrack}
      />
    );
  } else {
    videoView = (
      <View style={styles.videoView}>
        <View style={styles.spacer} />
        <Text>
            Camera off
        </Text>
        <View style={styles.spacer} />
      </View>
    );
  }

  const displayName = participant.name
    ? participant.name
    : participant.identity;
  return (
    <View style={[styles.container, style]}>
      {videoView}
      <View style={styles.identityBar}>
        <Text style={{ color: colors.text }}>{displayName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00153C',
  },
  spacer: {
    flex: 1,
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  identityBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 1,
    padding: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  icon: {
    width: 40,
    height: 40,
    alignSelf: 'center',
  },
});
