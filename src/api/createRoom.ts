import { http } from './index';

interface Response {
  token: string;
  room: string;
}

const createRoom = async (): Promise<Response> => {
    // Returns an "key" and "endpoint" key. Upload a file named "key" to the endpoint.
    const { data } = await http.post<Response>('sessions/test/room/create');

    return data;
};

export default createRoom;
