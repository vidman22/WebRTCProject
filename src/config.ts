import { Platform } from 'react-native';

type Environment = 'production' | 'staging' | 'development';

export interface AppConfiguration extends Readonly<any> {
    graphUrl: string;
    muxBaseUrl: string;
    muxVideoExt: string;
    googleClientId: string;
    appleClientId: string;
    api: Readonly<{
        timeout: number;
        endpoint: string;
    }>;
    livekitUrl: string;
    ipStackKey: string;
    appStoreUrl: string;
    baseWebUrl: string;
    redirectUrl: string;
    appleRedirectUrl: string;
}

const isDevelopmentMode = true; //__DEV__;


const config: AppConfiguration = {
    // graphUrl: 'https://graph.evelearn.com/v1/graphql',
    livekitUrl: 'wss://livekit.evelearn.com',
    muxBaseUrl: 'https://stream.mux.com/',
    muxVideoExt: '.m3u8',
    googleClientId: '922146467135-kv9gpv7ce6hu5cgaabd55k0b38o8sgmf.apps.googleusercontent.com',
    appleClientId: 'com.evelearn.evelearn', // this is the service id, which is required for mobile, the app id is 'org.reactjs.native.example.evelearn'
    appleRedirectUrl: 'https://evelearn.com/auth/login',
    redirectUrl: isDevelopmentMode ? 'http://localhost:3000' : 'https://evelearn.com',
    api: {
        endpoint: 'https://jvid.ngrok.io/api',
        timeout: 2000,
    },
    graphUrl: 'http://192.168.1.215:8080/v1/graphql',
    baseWebUrl: 'http://localhost:3000',
    ipStackKey: '',
    appStoreUrl: Platform.OS === 'ios' ? '' : ''
};

export default config;
