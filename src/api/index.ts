import axios, { AxiosError } from 'axios';
import appConfig from '../config';

export const http = axios.create({
    baseURL: appConfig.api.endpoint,
    timeout: 15000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    },
    withCredentials: false,
});



export const isAxiosError = (error: any): error is AxiosError => {
    return (
        error &&
        Object.prototype.hasOwnProperty.call(error, 'request') &&
        Object.prototype.hasOwnProperty.call(error, 'response')
    );
};

export const getErrorFromResponse = (error: AxiosError | string | Error) => {
    if (typeof error === 'string') {
        return error;
    }

    if (isAxiosError(error)) {
        // @ts-expect-error
        let message = error.response?.data?.message;
        
        // Yup validation objects return with a different format than our normal
        // error responses.
        // @ts-expect-error
        if (error.response?.status === 422 && error.response.data?.errors?.name) {
            // @ts-expect-error
            message = error.response.data?.errors?.message || message;
        }

        message = message || error.message;

        if ((error.response?.status || 0) >= 500) {
            return `${message}`;
        }

        return message;
    }

    return error.message;
};
