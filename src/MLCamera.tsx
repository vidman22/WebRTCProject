import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo
} from 'react';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
    Alert,
    Dimensions,
    AppStateStatus,
    AppState,
    Text
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
    Camera,
    useCameraDevices,
    PhotoFile,
    VideoFile,
    CameraRuntimeError,
    frameRateIncluded,
    CameraDeviceFormat,
    sortFormats,
    useFrameProcessor
} from 'react-native-vision-camera';
// @ts-ignore
import MlkitOcr from 'react-native-mlkit-ocr';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export const useIsForeground = (): boolean => {
    const [isForeground, setIsForeground] = useState(true);

    useEffect(() => {
        const onChange = (state: AppStateStatus): void => {
            setIsForeground(state === 'active');
        };
        const { remove } = AppState.addEventListener('change', onChange);
        return () => remove();
    }, [setIsForeground]);

    return isForeground;
};

declare let _WORKLET: true | undefined;

const PROGRESS_SIZE = 200;

const BUTTON_SIZE = 40;
// const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1;

type Props = NativeStackScreenProps<any, 'MLCamera'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const MLCamera = ({ navigation, route }: Props) => {
    const { top, right, bottom, left } = useSafeAreaInsets();
    // const { key, from } = route.params;
    const [isCameraInitialized, setIsCameraInitialized] = useState(false);
    const isFocused = useIsFocused();
    const isForeground = useIsForeground();
    const camera = useRef<Camera>(null);
    // check if camera page is active
    const isPressingButton = useSharedValue(false);
    const isActive = isFocused && isForeground;
    const zoom = useSharedValue(0);
    const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
    const [enableHdr, setEnableHdr] = useState(false);
    const [flash, setFlash] = useState<'off' | 'on'>('off');
    const [nightMode, setNightMode] = useState(false);
    const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
    const currentLabel = useSharedValue('');
    // camera format settings
    const devices = useCameraDevices();
    const device = devices.back;

    const formats = useMemo<CameraDeviceFormat[]>(() => {
        if (device?.formats == null) {
            return [];
        }
        return device.formats.filter(el => el.pixelFormat === '420v');
    }, [device?.formats]);

    useEffect(() => {
        const init = async () => {
            try {
                const cameraPermission = await Camera.getCameraPermissionStatus();
                if (!cameraPermission) {
                    const newCameraPermission = await Camera.requestCameraPermission();
                    if (newCameraPermission === 'denied') {
                        Alert.alert('Error', 'You must accept camera permissions to use this feature');
                    }
                }
            } catch (err) {
                Alert.alert('Error', 'You must accept camera permissions to use this feature');
            }
        };
        init();
    }, []);

    // #region Memos
    const [is60Fps, setIs60Fps] = useState(true);
    const fps = useMemo(() => {
        if (!is60Fps) {
            return 30;
        }

        if (nightMode && !device?.supportsLowLightBoost) {
            // User has enabled Night Mode, but Night Mode is not natively supported, so we simulate it by lowering the frame rate.
            return 30;
        }

        const supportsHdrAt60Fps = formats.some(f =>
            f.supportsVideoHDR &&
            f.frameRateRanges.some(r => frameRateIncluded(r, 60))
        );
        if (enableHdr && !supportsHdrAt60Fps) {
            // User has enabled HDR, but HDR is not supported at 60 FPS.
            return 30;
        }

        const supports60Fps = formats.some(f =>
            f.frameRateRanges.some(r => frameRateIncluded(r, 60))
        );
        if (!supports60Fps) {
            // 60 FPS is not supported by any format.
            return 30;
        }
        // If nothing blocks us from using it, we default to 60 FPS.
        return 60;
    }, [device?.supportsLowLightBoost, enableHdr, nightMode, formats, is60Fps]);
    const supportsCameraFlipping = useMemo(
        () => devices.back != null && devices.front != null,
        [devices.back, devices.front]
    );
    const supportsFlash = device?.hasFlash ?? false;
    const supportsHdr = useMemo(
        () => formats.some(f => f.supportsVideoHDR || f.supportsPhotoHDR),
        [formats]
    );
    const supports60Fps = useMemo(
        () =>
            formats.some(f =>
                f.frameRateRanges.some(rate => frameRateIncluded(rate, 60))
            ),
        [formats]
    );
    const canToggleNightMode = nightMode
        ? true // it's enabled so you have to be able to turn it off again
        : (device?.supportsLowLightBoost ?? false) || fps > 30; // either we have native support, or we can lower the FPS

    // const format = useMemo(() => {
    //     let result = formats;
    //     if (enableHdr) {
    //         // We only filter by HDR capable formats if HDR is set to true.
    //         // Otherwise we ignore the `supportsVideoHDR` property and accept formats which support HDR `true` or `false`
    //         result = result.filter(f => f.supportsVideoHDR || f.supportsPhotoHDR);
    //     }

    //     // find the first format that includes the given FPS
    //     return result.find(f =>
    //         f.frameRateRanges.some(r => frameRateIncluded(r, fps))
    //     );
    // }, [formats, fps, enableHdr]);

    const onFlipCameraPressed = useCallback(() => {
        setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
    }, []);

    const onFlashPressed = useCallback(() => {
        setFlash(f => (f === 'off' ? 'on' : 'off'));
    }, []);
    // #endregion


    const setIsPressingButton = useCallback(
        (_isPressingButton: boolean) => {
            isPressingButton.value = _isPressingButton;
        },
        [isPressingButton]
    );

    const onInitialized = useCallback(() => {
        setIsCameraInitialized(true);
    }, []);

    const onMediaCaptured = useCallback(async (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
        try {   
            console.log('media.path', media.path);
            const resultFromUri = await MlkitOcr.detectFromUri(media.path);
            // const resultFromFile = await MlkitOcr.detectFromFile(media.path);
            console.log('resultFromUri', resultFromUri);
            // console.log('resultFromFile', resultFromFile);
        } catch (err) {
            // console.error(err);
        }
    }, []);

    // useEffect(() => {
    //     log(currentLabel.value);
    // }, [currentLabel.value]);

    const onError = useCallback((error: CameraRuntimeError) => {
        Alert.alert('Error', error.message);
    }, []);

    const minZoom = device?.minZoom ?? 1;
    const maxZoom = Math.min(device?.maxZoom ?? 1, 1.2);

    return (
        <View
            style={{
                ...styles.container,
                paddingTop: top
            }}
        >
            <TouchableOpacity
                style={{
                    ...styles.leftTextButton,
                    left: left + 10,
                    top
                }}
                onPress={() => navigation.goBack()}
            >
                <Text>
                    Close
                </Text>
            </TouchableOpacity>
            {device &&
                <Camera
                    isActive={isFocused}
                    // frameProcessor={frameProcessor}

                    ref={camera}
                    // format={format}
                    // preset={'cif-352x288'}
                    device={device}
                    fps={30}
                    // hdr={enableHdr}
                    style={StyleSheet.absoluteFill}
                    lowLightBoost={device?.supportsLowLightBoost && nightMode}
                    onInitialized={onInitialized}
                    photo
                    onError={onError}
                    frameProcessorFps={3}
                />
            }
            <TouchableOpacity
                style={{
                    ...styles.leftTextButton,
                    left: left + 10,
                    top: 100
                }}
                onPress={async () => {
                    try {

                        const photo = await camera.current?.takePhoto({
                            qualityPrioritization: 'speed',
                            flash: 'off',
                            skipMetadata: true,
                        });
                        if (!photo) return;
                        console.log('photo', photo.path);
                        await onMediaCaptured(photo, 'photo');
                    } catch (err) {
                        // console.error(err);
                    }
                }}
            >
                <Text>
                    Capture
                </Text>
            </TouchableOpacity>

            <View
                style={{
                    ...styles.rightButtonRow,
                    right: right + 6,
                    top
                }}
            >
                {supportsCameraFlipping && (
                    <View style={styles.centerButton}>
                        <Pressable style={styles.button} onPress={onFlipCameraPressed}>
                            <Text>

                            </Text>
                        </Pressable>
                        <Text style={{ color: '#fff' }}>
                            FLIP
                        </Text>
                    </View>
                )}
                {supports60Fps && (
                    <View style={styles.centerButton}>
                        <Pressable style={styles.button} onPress={() => setIs60Fps(!is60Fps)}>
                            <Text style={{ color: '#fff' }}>
                                FPS
                            </Text>
                        </Pressable>
                        <Text style={{ color: '#fff' }}>
                            {is60Fps ? '60' : '30'}
                        </Text>
                    </View>
                )}
                {supportsFlash && (
                    <View style={styles.centerButton}>
                        <Pressable style={styles.button} onPress={onFlashPressed}>
                            {flash === 'on'
                                ? (
                                    <Text>
                                        Flash
                                    </Text>
                                )
                                : (
                                    <Text>
                                        Flash off
                                    </Text>
                                )}
                        </Pressable>
                        <Text style={{ color: '#fff' }}>
                            {flash.toUpperCase()}
                        </Text>
                    </View>
                )}
                {supportsHdr && (
                    <View style={styles.centerButton}>
                        <Pressable style={styles.button} onPress={() => setEnableHdr((h) => !h)}>
                            <Text style={{ color: enableHdr ? '#eee' : '#fff' }}>
                                HDR
                            </Text>
                        </Pressable>
                        <Text style={{ color: '#fff' }}>
                            {enableHdr ? 'ON' : 'OFF'}
                        </Text>
                    </View>
                )}
                {canToggleNightMode && (
                    <View style={styles.centerButton}>
                        <Pressable
                            style={styles.button}
                            onPress={() => setNightMode(s => !s)}
                        >
                            {nightMode
                                ? (
                                    <Text>
                                        Night
                                    </Text>
                                )
                                : (
                                    <Text>
                                        Night off
                                    </Text>
                                )}
                        </Pressable>
                        <Text style={{ color: '#fff' }}>
                            {nightMode ? 'ON' : 'OFF'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: SCREEN_HEIGHT,
        position: 'relative',
        backgroundColor: 'black'
    },
    navBar: {
        zIndex: 10,
        position: 'relative',
        backgroundColor: '#fff',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    formLabel: {
        paddingBottom: 10,
        paddingTop: 10,
        color: '#0093E9'
    },
    buttonContainer: {
        alignItems: 'center',
        paddingTop: 20,
        marginBottom: 40
    },
    submitButton: {
        paddingHorizontal: 60,
        paddingVertical: 10,
        backgroundColor: '#0093E9',
        borderRadius: 25
    },
    formInput: {
        height: 40,
        backgroundColor: '#f5f5f5',
        color: '#0093E9',
        borderRadius: 4,
        paddingLeft: 20
    },
    centerButton: {
        marginBottom: 20
    },
    button: {
        marginBottom: 0,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: 'rgba(140, 140, 140, 0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomButtons: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    leftTextButton: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 99
    },
    captureButton: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 100
    },
    rightButtonRow: {
        flex: 4,
        zIndex: 200,
        position: 'absolute'
    }
});

export default MLCamera;
