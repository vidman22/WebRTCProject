import { http } from './index';

interface Data {
  room: string;
}

interface Response {
  token: string;
}

const getToken = async ({ room }: Data): Promise<Response> => {
    // Returns an "key" and "endpoint" key. Upload a file named "key" to the endpoint.
    const { data } = await http.get<Response>('sessions/test/room/token', {
        params: { room }
    });

    return data;
};

export default getToken;
