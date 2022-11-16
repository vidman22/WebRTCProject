import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View, Button, Platform } from 'react-native';
import RNPermissions, { PERMISSIONS, RESULTS, requestMultiple, checkMultiple } from 'react-native-permissions';
import type { RootStackParamList } from '../App';
import getToken from './api/getToken';
import createRoom from './api/createRoom';

const DEFAULT_URL = 'wss://livekit.evelearn.com';


export const PreJoinPage = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, 'PreJoinPage'>) => {

    const getPermission = async () => {
        const cameraP = Platform.select({
            ios: PERMISSIONS.IOS.CAMERA,
            android: PERMISSIONS.ANDROID.CAMERA,
            default: PERMISSIONS.IOS.CAMERA,
        });
        const microphoneP = Platform.select({
            ios: PERMISSIONS.IOS.MICROPHONE,
            android: PERMISSIONS.ANDROID.RECORD_AUDIO,
            default: PERMISSIONS.IOS.MICROPHONE,
        });
        let cameraPermission = await RNPermissions.check(cameraP);
        if (cameraPermission !== RESULTS.BLOCKED && cameraPermission !== RESULTS.GRANTED) {
            cameraPermission = await RNPermissions.request(cameraP);
            if (cameraPermission === RESULTS.BLOCKED || cameraPermission !== RESULTS.GRANTED) {
                throw new Error('You must accept camera permissions to use this feature');
            }
            throw new Error('You must accept camera permissions to use this feature');
        }
        let microphonePermission = await RNPermissions.check(microphoneP);
        if (microphonePermission !== RESULTS.BLOCKED && microphonePermission !== RESULTS.GRANTED) {
            microphonePermission = await RNPermissions.request(microphoneP);
            if (microphonePermission === RESULTS.BLOCKED || microphonePermission !== RESULTS.GRANTED) {
                throw new Error('You must accept microphone permissions to use this feature');
            }
            throw new Error('You must accept microphone permissions to use this feature');
        }

    }

    const handleCreate = async () => {
        try {
            await getPermission();
            const { token, room: roomUUID } = await createRoom();
            navigation.push('RoomPage', { url: DEFAULT_URL, token: token });
        } catch (err) {
            console.error(err);
        }
    }

    const handleJoin = async () => {
        try {
            await getPermission();
            const { token } = await getToken({
                room: 'TestRoom'
            });
            navigation.push('RoomPage', { url: DEFAULT_URL, token: token });
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <View style={styles.container}>
            <Button
                title="Create"
                onPress={handleCreate}
            />
            <Button
                title="Join"
                onPress={handleJoin}
            />
            <View style={styles.spacer} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        width: 60,
        height: 60,
        marginVertical: 20,
    },
    input: {
        width: '100%',
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
    spacer: {
        height: 10,
    },
});