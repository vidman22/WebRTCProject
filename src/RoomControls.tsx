import * as React from 'react';
import { useState } from 'react';
import {
    StyleSheet,
    View,
    Pressable,
    ViewStyle,
    StyleProp,
    Modal,
    Text,
} from 'react-native';
import { AudioOutputList } from './AudioOutputList';

export type Props = {
    micEnabled?: boolean;
    setMicEnabled: (enabled: boolean) => void;
    cameraEnabled?: boolean;
    setCameraEnabled: (enabled: boolean) => void;
    screenShareEnabled: boolean;
    setScreenShareEnabled: (enabled: boolean) => void;
    onDisconnectClick: () => void;
    style?: StyleProp<ViewStyle>;
};
export const RoomControls = ({
    micEnabled = false,
    setMicEnabled,
    cameraEnabled = false,
    setCameraEnabled,
    screenShareEnabled = false,
    setScreenShareEnabled,
    onDisconnectClick,
    style,
}: Props) => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={[style, styles.container]}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <AudioOutputList
                            onSelect={() => {
                                return setModalVisible(false);
                            }}
                        />
                    </View>
                </View>
            </Modal>
            <Pressable
                onPress={() => {
                    setMicEnabled(!micEnabled);
                }}
            >
                <Text>
                    Mic
                </Text>
            </Pressable>
            <Pressable
                onPress={() => {
                    setCameraEnabled(!cameraEnabled);
                }}
            >
                <Text>
                    Camera
                </Text>
            </Pressable>

            <Pressable
                onPress={() => {
                    onDisconnectClick();
                }}
            >
                <Text>
                    Cancel
                </Text>
            </Pressable>

            <Pressable
                onPress={() => {
                    setModalVisible(true);
                }}
            >
                <Text>
                    Show Modal
                </Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        marginVertical: 8,
    },
    icon: {
        width: 32,
        height: 32,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'black',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});
